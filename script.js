// script.js - versión final y estable
window.onload = () => {
  // in-memory data
  let data = [];
  let headers = [];
  let chartInstance = null;

  // DOM shortcuts
  const el = id => document.getElementById(id);
  const fileInput = el('fileInput');
  const loadBtn = el('loadBtn');
  const exportBtn = el('exportBtn');
  const content = el('content');

  // menu buttons
  const btn = n => el('opt' + n);

  // util functions
  const isNum = v => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  const toNum = v => (v === null || v === undefined || v === '') ? NaN : Number(v);
  const round = (v, d = 3) => Math.round(v * (10 ** d)) / (10 ** d);
  const escape = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

  // load csv
  loadBtn.onclick = () => {
    const file = fileInput.files[0];
    if (!file) return alert('Selecciona un archivo CSV');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: false,
      dynamicTyping: false,
      complete: (res) => {
        data = res.data.map(r => r); // keep as-is (strings)
        headers = res.meta.fields || [];
        alert(`CSV cargado: ${data.length} filas, ${headers.length} columnas`);
        renderWelcome();
      },
      error: (err) => alert('Error leyendo CSV: ' + err)
    });
  };

  // export csv
  exportBtn.onclick = () => {
    if (!data.length) return alert('No hay datos para exportar');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export.csv';
    a.click();
  };

  // render welcome
  function renderWelcome() {
    content.innerHTML = `<p>CSV cargado. Columnas: <strong>${headers.join(', ')}</strong></p>
                         <small class="note">Usa el menú (1-12) para operar.</small>`;
  }

  // render table (all or first n)
  function renderTable(n = null) {
    if (!headers.length) { content.innerHTML = '<p>Carga un CSV primero.</p>'; return; }
    const rows = (n && Number(n) > 0) ? data.slice(0, Number(n)) : data;
    let html = `<div class="controls-row">
      <button id="showAll">Mostrar todo</button>
      <button id="showFirst">Mostrar primeras N</button>
      <input id="inputN" class="input-inline" placeholder="N" style="width:80px">
      <button id="refresh">Refrescar</button>
    </div>`;
    html += `<table><thead><tr>${headers.map(h => `<th>${escape(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r, idx) => {
      html += '<tr>';
      headers.forEach(h => {
        const val = r[h] === undefined || r[h] === null ? '' : String(r[h]);
        html += `<td contenteditable onblur="window._updateCell(${idx}, '${h.replaceAll("'", "\\'")}', this.innerText)">${escape(val)}</td>`;
      });
      html += `<td><button onclick="window._deleteRow(${idx})">Eliminar</button></td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML = html;

    el('showAll').onclick = () => renderTable();
    el('showFirst').onclick = () => {
      const k = Number(el('inputN').value || 5);
      renderTable(k);
    };
    el('refresh').onclick = () => renderTable(n);
  }

  // expose update/delete for inline handlers
  window._updateCell = (index, col, value) => {
    if (index < 0 || index >= data.length) return;
    if (!(col in data[index])) data[index][col] = '';
    data[index][col] = value;
  };
  window._deleteRow = (i) => {
    if (!confirm(`Eliminar fila ${i}?`)) return;
    data.splice(i, 1);
    renderTable();
  };

  // Menu option implementations:

  // 1. Mostrar primeras filas
  btn(1).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const n = Number(prompt('¿Cuántas filas mostrar? [5]', '5') || 5);
    renderTable(n);
  };

  // 2. Agregar fila
  btn(2).onclick = () => {
    if (!headers.length) return alert('Carga un CSV');
    let html = `<h3>Agregar fila</h3><div id="addForm">`;
    headers.forEach(h => html += `<div><label>${escape(h)}: </label><input id="a_${h}" class="input-inline"></div>`);
    html += `</div><div style="margin-top:10px"><button id="addSave">Guardar</button></div>`;
    content.innerHTML = html;
    el('addSave').onclick = () => {
      const obj = {};
      headers.forEach(h => obj[h] = el(`a_${h}`).value || '');
      data.push(obj);
      alert('Fila agregada');
      renderTable();
    };
  };

  // 3. Actualizar fila
  btn(3).onclick = () => {
    if (!data.length) return alert('No hay filas');
    const idx = Number(prompt(`Índice a actualizar (0..${data.length - 1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    let html = `<h3>Actualizar fila ${idx}</h3><div id="updForm">`;
    headers.forEach(h => {
      const cur = data[idx][h] ?? '';
      html += `<div><label>${escape(h)} (actual: ${escape(String(cur))}): </label><input id="u_${h}" class="input-inline"></div>`;
    });
    html += `</div><div style="margin-top:10px"><button id="updSave">Aplicar</button></div>`;
    content.innerHTML = html;
    el('updSave').onclick = () => {
      headers.forEach(h => {
        const v = el(`u_${h}`).value;
        if (v !== '') data[idx][h] = v;
      });
      alert('Fila actualizada');
      renderTable();
    };
  };

  // 4. Borrar fila
  btn(4).onclick = () => {
    if (!data.length) return alert('No hay filas');
    const idx = Number(prompt(`Índice a borrar (0..${data.length - 1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    if (!confirm(`Borrar fila ${idx}?`)) return;
    data.splice(idx, 1);
    alert('Fila borrada');
    renderTable();
  };

  // 5. Buscar texto en columna
  btn(5).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const col = prompt('Columna:');
    if (!col) return;
    if (!headers.includes(col)) return alert('Columna no encontrada');
    const txt = prompt('Texto a buscar (case-insensitive):') || '';
    const res = data.filter(r => String(r[col] ?? '').toLowerCase().includes(txt.toLowerCase()));
    content.innerHTML = `<h3>Resultados búsqueda (${res.length})</h3>`;
    renderSearch(res);
  };

  // 6. Filtrar filas por expresión (usa Function; cuidado si sitio público)
  btn(6).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const expr = prompt('Escribe una expresión usando "row", ej: Number(row["Puntaje"])>3');
    if (!expr) return;
    try {
      const fn = new Function('row', `try{return (${expr});}catch(e){return false;}`);
      const res = data.filter(r => fn(r));
      content.innerHTML = `<h3>Filtrado (${res.length})</h3>`;
      renderSearch(res);
    } catch (e) {
      alert('Expresión inválida');
    }
  };

  // 7. Ordenar por columna
  btn(7).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const col = prompt('Columna para ordenar:');
    if (!col) return;
    const asc = confirm('Orden ascendente? Aceptar=ascendente, Cancelar=descendente');
    data.sort((a, b) => {
      const na = toNum(a[col]), nb = toNum(b[col]);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return asc ? na - nb : nb - na;
      return asc ? String(a[col] ?? '').localeCompare(String(b[col] ?? '')) : String(b[col] ?? '').localeCompare(String(a[col] ?? ''));
    });
    alert('Orden aplicado');
    renderTable();
  };

  // 8. Consultas/predefinidas (15)
  btn(8).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    let html = `<h3>Consultas (15)</h3><div class="controls-row">`;
    const queries = [
      ['a) Total de filas', 'q1'], ['b) Lista columnas', 'q2'], ['c) Conteo nulos', 'q3'],
      ['d) Media columna', 'q4'], ['e) Suma columna', 'q5'], ['f) Min-Max', 'q6'],
      ['g) Conteo por categoría', 'q7'], ['h) Top N', 'q8'], ['i) Filtrar > umbral', 'q9'],
      ['j) Buscar keywords', 'q10'], ['k) Pipeline sumar > umbral', 'q11'], ['l) Correlación', 'q12'],
      ['m) Filas únicas', 'q13'], ['n) Reemplazar por mapping', 'q14'], ['o) Resumen reducido', 'q15']
    ];
    queries.forEach(q => html += `<button id="${q[1]}">${q[0]}</button>`);
    html += `</div><div id="qResult"></div>`;
    content.innerHTML = html;

    const r = el('qResult');
    el('q1').onclick = () => r.innerHTML = `<pre>${q_total_rows()}</pre>`;
    el('q2').onclick = () => r.innerHTML = `<pre>${JSON.stringify(q_column_list(), null, 2)}</pre>`;
    el('q3').onclick = () => r.innerHTML = `<pre>${JSON.stringify(q_null_counts(), null, 2)}</pre>`;
    el('q4').onclick = () => {
      const c = prompt('Columna para media:'); try { r.innerHTML = `<pre>${q_mean(c)}</pre>`; } catch (e) { alert(e); }
    };
    el('q5').onclick = () => {
      const c = prompt('Columna para suma:'); try { r.innerHTML = `<pre>${q_sum(c)}</pre>`; } catch (e) { alert(e); }
    };
    el('q6').onclick = () => {
      const c = prompt('Columna para min/max:'); try { r.innerHTML = `<pre>${JSON.stringify(q_min_max(c))}</pre>`; } catch (e) { alert(e); }
    };
    el('q7').onclick = () => {
      const c = prompt('Columna para conteo por categoría:'); try { r.innerHTML = `<pre>${JSON.stringify(q_value_counts(c), null, 2)}</pre>`; } catch (e) { alert(e); }
    };
    el('q8').onclick = () => {
      const c = prompt('Columna Top N:'); const n = Number(prompt('Top N [5]:','5')); r.innerHTML = `<pre>${JSON.stringify(q_top_n(c,n), null,2)}</pre>`;
    };
    el('q9').onclick = () => {
      const c = prompt('Columna:'), th = Number(prompt('Umbral:')); r.innerHTML = `<pre>${JSON.stringify(q_filter_threshold(c,th).slice(0,50), null,2)}\n\n(mostrando hasta 50)</pre>`;
    };
    el('q10').onclick = () => {
      const cols = prompt('Columnas separadas por coma:').split(',').map(s=>s.trim()); const kw = prompt('Keyword:'); r.innerHTML = `<pre>${JSON.stringify(q_search_keywords(cols, kw).slice(0,50), null,2)}</pre>`;
    };
    el('q11').onclick = () => {
      const c = prompt('Columna:'), th = Number(prompt('Umbral:')); r.innerHTML = `<pre>${q_pipeline_sum_above(c,th)}</pre>`;
    };
    el('q12').onclick = () => {
      const c1 = prompt('Columna X:'), c2 = prompt('Columna Y:'); r.innerHTML = `<pre>Correlación: ${q_correlation(c1,c2)}</pre>`;
    };
    el('q13').onclick = () => { const c = prompt('Columna:'); r.innerHTML = `<pre>${JSON.stringify(q_unique_rows(c).slice(0,50), null,2)}</pre>`; };
    el('q14').onclick = () => {
      const c = prompt('Columna:'), mp = prompt('Mapping JSON (ej: {"Yes":"Si"}):');
      try { q_replace_map(c, JSON.parse(mp)); alert('Reemplazo aplicado'); } catch (e) { alert('JSON inválido'); }
    };
    el('q15').onclick = () => r.innerHTML = `<pre>${JSON.stringify(q_reduce_summary(), null,2)}</pre>`;
  };

  // 9. Estadísticas y resumen
  btn(9).onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    let html = `<h3>Resumen y Estadísticas</h3><div id="statsOut"></div>`;
    content.innerHTML = html;
    el('statsOut').innerHTML = `<pre>${summary()}</pre>`;
  };

  // 10. Exportar (reusa botón)
  btn(10).onclick = () => exportBtn.click();

  // 11. Gráficos
  btn(11).onclick = () => {
    if (!headers.length) return alert('Carga un CSV');
    let html = `<h3>Gráficos</h3>
      <div class="controls-row">
        <label>Histograma:</label>
        <select id="histCol">${headers.map(h => `<option>${h}</option>`).join('')}</select>
        <label>Bins:</label><input id="histBins" class="input-inline" value="10" style="width:60px">
        <button id="doHist">Dibujar</button>
      </div>
      <div class="controls-row" style="margin-top:10px">
        <label>Scatter X:</label>
        <select id="scX">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
        <label>Y:</label>
        <select id="scY">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
        <button id="doSc">Dibujar scatter</button>
      </div>
      <div id="chartContainer"><canvas id="chartCanvas"></canvas></div>`;
    content.innerHTML = html;
    el('doHist').onclick = () => drawHistogram(el('histCol').value, Number(el('histBins').value) || 10);
    el('doSc').onclick = () => drawScatter(el('scX').value, el('scY').value);
  };

  // 12. GUI optional -> just render table
  btn(12).onclick = () => renderTable();

  // 0. exit = clear session
  btn(0).onclick = () => {
    if (!confirm('Limpiar datos en memoria?')) return;
    data = []; headers = []; content.innerHTML = '<p>Sesión reiniciada.</p>';
  };

  // ---------------- Queries implementations ----------------
  function q_total_rows() { return data.reduce((acc,_)=>acc+1,0); }
  function q_column_list(){ return headers.slice(); }
  function q_null_counts(){ const out={}; headers.forEach(h=> out[h]=data.reduce((s,r)=>s + ((r[h]===undefined||r[h]===null||r[h]==='')?1:0),0)); return out;}
  function q_mean(column){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  function q_sum(column){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    return vals.reduce((a,b)=>a+b,0);
  }
  function q_min_max(column){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    return vals.length ? [Math.min(...vals), Math.max(...vals)] : [null,null];
  }
  function q_value_counts(column){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    return data.reduce((acc,r)=>{ const v = (r[column]===undefined||r[column]===null||r[column]==='') ? 'NULL' : r[column]; acc[v] = (acc[v]||0)+1; return acc; }, {});
  }
  function q_top_n(column,n=5){ const vc = q_value_counts(column); return Object.entries(vc).sort((a,b)=>b[1]-a[1]).slice(0,n); }
  function q_filter_threshold(column, threshold){ if (!headers.includes(column)) throw 'Columna no encontrada'; return data.filter(r=>{ const v=toNum(r[column]); return !Number.isNaN(v) && v>threshold; }); }
  function q_search_keywords(columns, keyword){ const kw = (keyword||'').toLowerCase(); return data.filter(r => columns.some(c => String(r[c] ?? '').toLowerCase().includes(kw))); }
  function q_pipeline_sum_above(column, threshold){ return data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v) && v>threshold).reduce((a,b)=>a+b,0); }
  function q_correlation(c1,c2){
    if (!headers.includes(c1)||!headers.includes(c2)) throw 'Columnas no encontradas';
    const pairs = data.map(r=>[toNum(r[c1]), toNum(r[c2])]).filter(p=>!Number.isNaN(p[0])&&!Number.isNaN(p[1]));
    if (pairs.length<2) return null;
    const xs = pairs.map(p=>p[0]), ys=pairs.map(p=>p[1]);
    const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
    const mx=mean(xs), my=mean(ys);
    let num=0, dx=0, dy=0;
    for(let i=0;i<xs.length;i++){ num += (xs[i]-mx)*(ys[i]-my); dx += (xs[i]-mx)**2; dy += (ys[i]-my)**2; }
    const denom = Math.sqrt(dx*dy); return denom===0?0: num/denom;
  }
  function q_unique_rows(column){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    const seen=new Set(); const out=[];
    for(const r of data){ let v=r[column]; if (v===undefined||v===null||v==='') v='NULL'; if(!seen.has(v)){ seen.add(v); out.push(r); } }
    return out;
  }
  function q_replace_map(column, mapping){
    if (!headers.includes(column)) throw 'Columna no encontrada';
    data = data.map(r => { r[column] = (r[column] in mapping) ? mapping[r[column]] : r[column]; return r; });
  }
  function q_reduce_summary(){
    return headers.reduce((acc,c) => { acc[c] = { non_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?0:1),0), n_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?1:0),0) }; return acc; }, {});
  }

  function summary(){
    const out = {};
    headers.forEach(h => {
      const nums = data.map(r=>toNum(r[h])).filter(v=>!Number.isNaN(v));
      if (nums.length){
        nums.sort((a,b)=>a-b);
        const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
        const std = Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/nums.length);
        const q = (arr,p)=>{ const idx=(arr.length-1)*p; const lo=Math.floor(idx), hi=Math.ceil(idx); return lo===hi?arr[lo]:arr[lo]*(hi-idx)+arr[hi]*(idx-lo); };
        out[h] = { count: nums.length, mean: round(mean,4), std: round(std,4), min: nums[0], q25: round(q(nums,0.25),4), median: round(q(nums,0.5),4), q75: round(q(nums,0.75),4), max: nums[nums.length-1] };
      } else {
        const uniq = new Set(data.map(r=>r[h]).filter(x=>x!==undefined&&x!==null&&x!=='')); out[h] = { count: data.length, unique: uniq.size };
      }
    });
    return JSON.stringify(out, null, 2);
  }

  // render search result helper
  function renderSearch(rows){
    if (!rows || !rows.length) { content.innerHTML += '<p>No hay coincidencias.</p>'; return; }
    let html = `<p>Resultados: ${rows.length} filas</p><table><thead><tr>${headers.map(h=>`<th>${escape(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r, idx) => {
      html += '<tr>';
      headers.forEach(h => html += `<td>${escape(String(r[h] ?? ''))}</td>`);
      html += `<td>—</td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML += html;
  }

  // charts
  function drawHistogram(column, bins = 10) {
    const vals = data.map(r => toNum(r[column])).filter(v => !Number.isNaN(v));
    if (!vals.length) return alert('No hay valores numéricos en la columna');
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = (max - min) || 1;
    const binSize = range / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => {
      let idx = Math.floor((v - min) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    });
    const labels = counts.map((_, i) => `${round(min + i * binSize,3)} - ${round((i === bins - 1) ? max : (min + (i+1)*binSize),3)}`);
    renderChart({ labels, datasets: [{ label: `Histograma: ${column}`, data: counts }] }, 'bar');
  }

  function drawScatter(xcol, ycol) {
    const pairs = data.map(r => [toNum(r[xcol]), toNum(r[ycol])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (!pairs.length) return alert('No hay pares numéricos válidos');
    const plotData = pairs.map(p => ({ x: p[0], y: p[1] }));
    renderChart({ datasets: [{ label: `${xcol} vs ${ycol}`, data: plotData }] }, 'scatter');
  }

  function renderChart(chartData, type) {
    const canvas = el('chartCanvas') || (() => {
      content.innerHTML += `<div id="chartContainer"><canvas id="chartCanvas"></canvas></div>`; return el('chartCanvas');
    })();
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, { type, data: chartData, options: { responsive: true, scales: { x: { title: { display: !!chartData.datasets[0].label, text: chartData.datasets[0].label && chartData.datasets[0].label.split(' vs ')[0] } } } } });
  }

  // expose small debug
  window.__CSV = { getData: () => data, getHeaders: () => headers };
};
