// script.js — completa, sin modales, todo en la misma página
window.addEventListener('DOMContentLoaded', () => {
  // In-memory model (simula CSVManager)
  let data = [];        // array de filas: cada fila es objeto {col: value}
  let headers = [];     // array de strings

  // DOM refs
  const fileInput = document.getElementById('fileInput');
  const btnLoad = document.getElementById('btnLoad');
  const btnExport = document.getElementById('btnExport');
  const controls = document.getElementById('controls');
  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const menuButtons = document.querySelectorAll('.menu-btn');

  // Chart state
  let chartInstance = null;

  // Helpers
  const el = id => document.getElementById(id);
  const isNumber = v => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  const toNumber = v => (v === null || v === undefined || v === '') ? NaN : Number(v);
  const escapeHtml = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

  // Utility: render title/sub
  function setStatus(titleText, subText) {
    title.textContent = titleText;
    subtitle.textContent = subText || '';
  }

  // Load CSV using PapaParse (robusto)
  btnLoad.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return alert('Selecciona un archivo CSV con encabezados.');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        headers = res.meta.fields || [];
        data = res.data.map(r => {
          // keep original strings; missing keys -> ''
          headers.forEach(h => { if (!(h in r)) r[h] = ''; });
          return r;
        });
        setStatus('CSV cargado', `${data.length} filas • ${headers.length} columnas`);
        renderTable();      // muestra tabla por defecto
        renderControlsEmpty();
      },
      error: err => alert('Error leyendo CSV: ' + err)
    });
  });

  // Exportar CSV (Papa unparse)
  btnExport.addEventListener('click', () => {
    if (!data.length) return alert('No hay datos para exportar');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'export.csv'; a.click();
  });

  // Menu buttons wiring
  menuButtons.forEach(b => b.addEventListener('click', () => {
    const act = b.dataset.action;
    if (act !== '0' && !data.length && !['10','12'].includes(act)) return alert('Carga un CSV primero.');
    switch (act) {
      case '1': menuShowFirst(); break;
      case '2': menuAddRow(); break;
      case '3': menuUpdateRow(); break;
      case '4': menuDeleteRow(); break;
      case '5': menuSearch(); break;
      case '6': menuFilterExpr(); break;
      case '7': menuSort(); break;
      case '8': menuQueries(); break;
      case '9': menuStats(); break;
      case '10': btnExport.click(); break;
      case '11': menuGraphs(); break;
      case '12': renderTable(); break;
      case '0': if (confirm('Limpiar datos en memoria?')) { data = []; headers = []; setStatus('Bienvenida','Carga un CSV para comenzar.'); controls.innerHTML=''; content.innerHTML='<p class="muted">Contenido limpio.</p>'; if (chartInstance) { chartInstance.destroy(); chartInstance = null; } } break;
      default: break;
    }
  }));

  /* ----------------------------- Render table ----------------------------- */
  function renderTable(limit = null) {
    if (!headers.length) { content.innerHTML = '<p class="muted">No hay CSV cargado.</p>'; return; }
    const rows = (limit && Number(limit) > 0) ? data.slice(0, Number(limit)) : data;
    let html = `<div class="controls-row">
      <button id="btnShowAll" class="btn">Mostrar todo</button>
      <button id="btnShowN" class="btn ghost">Mostrar primeras N</button>
      <input id="inputN" class="input-inline" placeholder="N" style="width:80px">
      <button id="btnRefresh" class="btn ghost">Refrescar</button>
    </div>`;
    html += `<table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r, idx) => {
      html += `<tr>`;
      headers.forEach(h => {
        const val = r[h] === undefined || r[h] === null ? '' : String(r[h]);
        html += `<td contenteditable onblur="window._updateCell(${idx}, '${h.replaceAll("'", "\\'")}', this.innerText)">${escapeHtml(val)}</td>`;
      });
      html += `<td><button class="btn ghost" onclick="window._deleteRow(${idx})">Eliminar</button></td></tr>`;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;

    // attach small table controls
    document.getElementById('btnShowAll').onclick = () => renderTable();
    document.getElementById('btnShowN').onclick = () => {
      const k = Number(document.getElementById('inputN').value || 5);
      renderTable(k);
    };
    document.getElementById('btnRefresh').onclick = () => renderTable(limit);
  }

  // expose update/delete for inline editing
  window._updateCell = (index, col, val) => {
    if (index < 0 || index >= data.length) return;
    if (!(col in data[index])) data[index][col] = '';
    data[index][col] = val;
  };
  window._deleteRow = (i) => {
    if (!confirm(`Eliminar fila ${i}?`)) return;
    data.splice(i,1);
    renderTable();
  };

  /* ----------------------------- Controls area helpers ----------------------------- */
  function renderControlsEmpty() { controls.innerHTML = `<small class="muted">Usa el menú para operar sobre los datos.</small>`; }

  function clearChart() {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  }

  /* ----------------------------- Menu implementations ----------------------------- */

  // 1. Mostrar primeras filas
  function menuShowFirst() {
    const n = Number(prompt('¿Cuántas filas mostrar? (default 5)', '5') || 5);
    renderTable(n);
  }

  // 2. Agregar fila (inline form)
  function menuAddRow() {
    if (!headers.length) return alert('Carga CSV');
    let html = `<h3>Agregar fila</h3><div class="controls-row">`;
    headers.forEach(h => html += `<input id="new_${h}" class="input-inline" placeholder="${h}">`);
    html += `</div><div style="margin-top:8px"><button id="saveNew" class="btn">Guardar fila</button></div>`;
    controls.innerHTML = html;
    document.getElementById('saveNew').onclick = () => {
      const row = {};
      headers.forEach(h => row[h] = document.getElementById(`new_${h}`).value || '');
      data.push(row);
      controls.innerHTML = `<small>Fila agregada. Total filas: ${data.length}</small>`;
      renderTable();
    };
  }

  // 3. Actualizar fila
  function menuUpdateRow() {
    if (!data.length) return alert('No hay filas');
    const idx = Number(prompt(`Índice de fila a actualizar (0 .. ${data.length-1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    let html = `<h3>Actualizar fila ${idx}</h3><div class="controls-row">`;
    headers.forEach(h => html += `<div style="display:flex;flex-direction:column"><label>${h}</label><input id="upd_${h}" class="input-inline" placeholder="${data[idx][h]??''}"></div>`);
    html += `</div><div style="margin-top:8px"><button id="saveUpd" class="btn">Aplicar</button></div>`;
    controls.innerHTML = html;
    document.getElementById('saveUpd').onclick = () => {
      headers.forEach(h => {
        const v = document.getElementById(`upd_${h}`).value;
        if (v !== '') data[idx][h] = v;
      });
      controls.innerHTML = `<small>Fila ${idx} actualizada.</small>`;
      renderTable();
    };
  }

  // 4. Borrar fila
  function menuDeleteRow() {
    if (!data.length) return alert('No hay filas');
    const idx = Number(prompt(`Índice de fila a borrar (0 .. ${data.length-1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    if (!confirm(`Borrar fila ${idx}?`)) return;
    data.splice(idx, 1);
    controls.innerHTML = `<small>Fila ${idx} borrada.</small>`;
    renderTable();
  }

  // 5. Buscar texto en columna
  function menuSearch() {
    const col = prompt('Columna a buscar:');
    if (!col) return;
    if (!headers.includes(col)) return alert('Columna no encontrada');
    const txt = prompt('Texto (case-insensitive):') || '';
    const res = data.filter(r => String(r[col] ?? '').toLowerCase().includes(txt.toLowerCase()));
    content.innerHTML = `<h3>Resultados (${res.length})</h3>`;
    renderSearch(res);
  }

  // 6. Filtrar por expresión (usa Function; advertencia si público)
  function menuFilterExpr() {
    const expr = prompt('Expresión usando row, e.g. Number(row["Puntaje"])>3:');
    if (!expr) return;
    try {
      const fn = new Function('row', `try { return (${expr}); } catch(e) { return false; }`);
      const res = data.filter(r => fn(r));
      content.innerHTML = `<h3>Filtrado (${res.length})</h3>`;
      renderSearch(res);
    } catch (e) {
      alert('Expresión inválida');
    }
  }

  // 7. Ordenar por columna
  function menuSort() {
    const col = prompt('Columna para ordenar:');
    if (!col) return;
    const asc = confirm('Orden ascendente? (Aceptar = ascendente)');
    data.sort((a,b) => {
      const na = toNumber(a[col]), nb = toNumber(b[col]);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return asc ? na - nb : nb - na;
      return asc ? String(a[col] ?? '').localeCompare(String(b[col] ?? '')) : String(b[col] ?? '').localeCompare(String(a[col] ?? ''));
    });
    controls.innerHTML = `<small>Orden aplicado por ${col} (${asc? 'asc' : 'desc'})</small>`;
    renderTable();
  }

  // 8. Consultas predefinidas (15)
  function menuQueries() {
    // render buttons for 15; results in area content
    let html = `<h3>Consultas (15)</h3><div class="controls-row">`;
    const items = [
      ['a) Total filas','a'],['b) Lista columnas','b'],['c) Conteo nulos por columna','c'],
      ['d) Media columna','d'],['e) Suma columna','e'],['f) Min-Max columna','f'],
      ['g) Conteo por categoría','g'],['h) Top N frecuencias','h'],['i) Filtrar por umbral','i'],
      ['j) Buscar keywords','j'],['k) Pipeline sumar > umbral','k'],['l) Correlación','l'],
      ['m) Filas únicas por columna','m'],['n) Reemplazar por mapping','n'],['o) Resumen reducido','o']
    ];
    items.forEach(it => html += `<button class="btn qbtn" data-q="${it[1]}">${it[0]}</button>`);
    html += `</div><div id="qResult"></div>`;
    controls.innerHTML = html;

    const qResult = document.getElementById('qResult');
    document.querySelectorAll('.qbtn').forEach(b => b.onclick = () => {
      const key = b.dataset.q;
      try {
        if (key === 'a') qResult.innerHTML = `<pre>Total filas: ${q_total_rows()}</pre>`;
        if (key === 'b') qResult.innerHTML = `<pre>${JSON.stringify(q_column_list(), null,2)}</pre>`;
        if (key === 'c') qResult.innerHTML = `<pre>${JSON.stringify(q_null_counts(), null,2)}</pre>`;
        if (key === 'd') { const c = prompt('Columna para media:'); qResult.innerHTML = `<pre>${q_mean(c)}</pre>`;}
        if (key === 'e') { const c = prompt('Columna para suma:'); qResult.innerHTML = `<pre>${q_sum(c)}</pre>`;}
        if (key === 'f') { const c = prompt('Columna min/max:'); qResult.innerHTML = `<pre>${JSON.stringify(q_min_max(c), null,2)}</pre>`;}
        if (key === 'g') { const c = prompt('Columna para conteo por categoría:'); qResult.innerHTML = `<pre>${JSON.stringify(q_value_counts(c), null,2)}</pre>`;}
        if (key === 'h') { const c = prompt('Columna Top N:'); const n = Number(prompt('Top N [5]:','5')); qResult.innerHTML = `<pre>${JSON.stringify(q_top_n(c,n), null,2)}</pre>`;}
        if (key === 'i') { const c = prompt('Columna:'), th = Number(prompt('Umbral:')); qResult.innerHTML = `<pre>${JSON.stringify(q_filter_threshold(c,th).slice(0,50), null,2)}\n\n(mostrando hasta 50)</pre>`;}
        if (key === 'j') { const cols = prompt('Columnas, separadas por coma:').split(',').map(s=>s.trim()); const kw = prompt('Keyword:'); qResult.innerHTML = `<pre>${JSON.stringify(q_search_keywords(cols,kw).slice(0,50), null,2)}</pre>`;}
        if (key === 'k') { const c = prompt('Columna:'), th = Number(prompt('Umbral:')); qResult.innerHTML = `<pre>${q_pipeline_sum_above(c,th)}</pre>`;}
        if (key === 'l') { const c1 = prompt('Columna X:'), c2 = prompt('Columna Y:'); qResult.innerHTML = `<pre>Correlación: ${q_correlation(c1,c2)}</pre>`;}
        if (key === 'm') { const c = prompt('Columna:'); qResult.innerHTML = `<pre>${JSON.stringify(q_unique_rows(c).slice(0,50), null,2)}</pre>`;}
        if (key === 'n') {
          const c = prompt('Columna:'), mp = prompt('Mapping JSON (ej: {"Yes":"Si"}):');
          try { q_replace_map(c, JSON.parse(mp)); qResult.innerHTML = `<pre>Reemplazo aplicado en ${c}.</pre>`; } catch(e){ qResult.innerHTML = `<pre>JSON inválido</pre>`; }
        }
        if (key === 'o') qResult.innerHTML = `<pre>${JSON.stringify(q_reduce_summary(), null,2)}</pre>`;
      } catch (err) {
        qResult.innerHTML = `<pre>Error: ${err}</pre>`;
      }
    });
  }

  // 9. Estadísticas y resumen
  function menuStats() {
    controls.innerHTML = `<button id="btnSummary" class="btn">Mostrar resumen (describe)</button>
                          <button id="btnMissing" class="btn ghost">Valores nulos por columna</button>
                          <div id="statOut" style="margin-top:8px"></div>`;
    document.getElementById('btnSummary').onclick = () => {
      document.getElementById('statOut').innerHTML = `<pre>${summary()}</pre>`;
    };
    document.getElementById('btnMissing').onclick = () => {
      document.getElementById('statOut').innerHTML = `<pre>${JSON.stringify(q_null_counts(), null,2)}</pre>`;
    };
  }

  // 11. Gráficos
  function menuGraphs() {
    if (!headers.length) return alert('Carga CSV primero');
    controls.innerHTML = `<div class="controls-row">
      <label>Histograma:</label>
      <select id="histCol">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
      <label>Bins:</label><input id="histBins" class="input-inline" value="10" style="width:70px">
      <button id="doHist" class="btn">Dibujar</button>
    </div>
    <div class="controls-row" style="margin-top:8px">
      <label>Scatter X:</label>
      <select id="scX">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
      <label>Y:</label>
      <select id="scY">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
      <button id="doSc" class="btn">Dibujar scatter</button>
    </div>
    <div id="chartContainer"></div>`;

    document.getElementById('doHist').onclick = () => {
      const col = document.getElementById('histCol').value;
      const bins = Number(document.getElementById('histBins').value) || 10;
      drawHistogram(col, bins);
    };
    document.getElementById('doSc').onclick = () => {
      const x = document.getElementById('scX').value, y = document.getElementById('scY').value;
      drawScatter(x, y);
    };
  }

  /* ----------------------------- Implementación de las 15 consultas ----------------------------- */
  function q_total_rows() { return data.length; }
  function q_column_list() { return headers.slice(); }
  function q_null_counts() {
    const out = {};
    headers.forEach(h => out[h] = data.reduce((s,r) => s + ((r[h] === undefined || r[h] === null || r[h]==='') ? 1 : 0), 0));
    return out;
  }
  function q_mean(column) {
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const vals = data.map(r => toNumber(r[column])).filter(v => !Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
  }
  function q_sum(column) {
    if (!headers.includes(column)) throw 'Columna no encontrada';
    return data.map(r => toNumber(r[column])).filter(v => !Number.isNaN(v)).reduce((a,b)=>a+b,0);
  }
  function q_min_max(column) {
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const vals = data.map(r => toNumber(r[column])).filter(v => !Number.isNaN(v));
    return vals.length ? [Math.min(...vals), Math.max(...vals)] : [null,null];
  }
  function q_value_counts(column) {
    if (!headers.includes(column)) throw 'Columna no encontrada';
    return data.reduce((acc,r) => { const v = (r[column]===undefined||r[column]===null||r[column]==='')?'NULL':r[column]; acc[v] = (acc[v]||0)+1; return acc; }, {});
  }
  function q_top_n(column, n=5) { const vc = q_value_counts(column); return Object.entries(vc).sort((a,b)=>b[1]-a[1]).slice(0,n); }
  function q_filter_threshold(column, threshold) { if (!headers.includes(column)) throw 'Columna no encontrada'; return data.filter(r => { const v = toNumber(r[column]); return !Number.isNaN(v) && v > threshold; }); }
  function q_search_keywords(columns, keyword) { const kw = (keyword||'').toLowerCase(); return data.filter(r => columns.some(c => String(r[c] ?? '').toLowerCase().includes(kw))); }
  function q_pipeline_sum_above(column, threshold) { return data.map(r => toNumber(r[column])).filter(v => !Number.isNaN(v) && v > threshold).reduce((a,b)=>a+b,0); }
  function q_correlation(c1, c2) {
    if (!headers.includes(c1) || !headers.includes(c2)) throw 'Columnas no encontradas';
    const pairs = data.map(r => [toNumber(r[c1]), toNumber(r[c2])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (pairs.length < 2) return null;
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
    const mx = mean(xs), my = mean(ys);
    let num = 0, dx = 0, dy = 0;
    for (let i=0;i<xs.length;i++){ num += (xs[i]-mx)*(ys[i]-my); dx += (xs[i]-mx)**2; dy += (ys[i]-my)**2; }
    const denom = Math.sqrt(dx*dy); return denom===0?0: num/denom;
  }
  function q_unique_rows(column) { if (!headers.includes(column)) throw 'Columna no encontrada'; const seen=new Set(); const out=[]; for (const r of data) { let v = r[column]; if (v===undefined||v===null||v==='') v='NULL'; if (!seen.has(v)) { seen.add(v); out.push(r); } } return out; }
  function q_replace_map(column, mapping) { if (!headers.includes(column)) throw 'Columna no encontrada'; data = data.map(r => { r[column] = (r[column] in mapping) ? mapping[r[column]] : r[column]; return r; }); }
  function q_reduce_summary() { return headers.reduce((acc,c) => { acc[c] = { non_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?0:1),0), n_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?1:0),0) }; return acc; }, {}); }

  // summary (describe)
  function summary() {
    const out = {};
    headers.forEach(h => {
      const nums = data.map(r=>toNumber(r[h])).filter(v => !Number.isNaN(v));
      if (nums.length) {
        nums.sort((a,b)=>a-b);
        const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
        const std = Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/nums.length);
        const q = (arr,p) => { const idx = (arr.length-1)*p; const lo = Math.floor(idx), hi = Math.ceil(idx); return lo===hi?arr[lo]:(arr[lo]*(hi-idx)+arr[hi]*(idx-lo)); };
        out[h] = { count: nums.length, mean, std, min: nums[0], q25: q(nums,0.25), median: q(nums,0.5), q75: q(nums,0.75), max: nums[nums.length-1] };
      } else {
        const uniq = new Set(data.map(r=>r[h]).filter(x=>x!==undefined && x!==null && x!=='')); out[h] = { count: data.length, unique: uniq.size };
      }
    });
    return JSON.stringify(out, null, 2);
  }

  // renderSearch helper
  function renderSearch(rows) {
    if (!rows || !rows.length) { content.innerHTML = '<p>No hay coincidencias.</p>'; return; }
    let html = `<p>Resultados: ${rows.length}</p><table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r, idx) => {
      html += '<tr>';
      headers.forEach(h => html += `<td>${escapeHtml(String(r[h] ?? ''))}</td>`);
      html += `<td>—</td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML = html;
  }

  /* ----------------------------- Charts: histogram & scatter ----------------------------- */
  function drawHistogram(column, bins = 10) {
    const vals = data.map(r => toNumber(r[column])).filter(v => !Number.isNaN(v));
    if (!vals.length) return alert('No hay valores numéricos en esa columna');
    const min = Math.min(...vals), max = Math.max(...vals), range = (max-min) || 1;
    const binSize = range / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => {
      let idx = Math.floor((v - min) / binSize);
      if (idx < 0) idx = 0; if (idx >= bins) idx = bins-1;
      counts[idx]++;
    });
    const labels = counts.map((_,i) => `${(min + i*binSize).toFixed(3)} - ${(i===bins-1?max:(min+(i+1)*binSize)).toFixed(3)}`);
    renderChart({ labels, datasets: [{ label: `Histograma: ${column}`, data: counts }] }, 'bar');
  }

  function drawScatter(xcol, ycol) {
    const pairs = data.map(r => [toNumber(r[xcol]), toNumber(r[ycol])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (!pairs.length) return alert('No hay pares numéricos válidos');
    const plot = pairs.map(p => ({ x: p[0], y: p[1] }));
    renderChart({ datasets: [{ label: `${xcol} vs ${ycol}`, data: plot }] }, 'scatter');
  }

  function renderChart(chartData, type) {
    // ensure container
    const existing = document.getElementById('chartCanvas');
    if (!existing) {
      content.innerHTML = `<div id="chartContainer"><canvas id="chartCanvas"></canvas></div>`;
    }
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, { type, data: chartData, options: { responsive: true, plugins: { legend: { display: true } } } });
  }

  // expose debug
  window.__CSV = { getData: () => data, getHeaders: () => headers };
  // initial state
  renderControlsEmpty();
});

