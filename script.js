// script.js — versión completa que implementa el menú CLI en la web
window.onload = () => {
  // datos en memoria (simulan tu CSVManager)
  let data = [];
  let headers = [];

  // helpers
  const el = id => document.getElementById(id);
  const isNumber = v => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  const toNum = v => (v === null || v === undefined || v === '') ? NaN : Number(v);

  // DOM
  const fileInput = el('fileInput');
  const loadBtn = el('loadBtn');
  const exportBtn = el('exportBtn');
  const content = el('content');

  // menú buttons
  const mapBtn = {
    1: el('opt1'), 2: el('opt2'), 3: el('opt3'), 4: el('opt4'),
    5: el('opt5'), 6: el('opt6'), 7: el('opt7'), 8: el('opt8'),
    9: el('opt9'), 10: el('opt10'), 11: el('opt11'), 12: el('opt12'), 0: el('opt0')
  };

  // ---- carga CSV ----
  loadBtn.onclick = () => {
    const file = fileInput.files[0];
    if (!file) return alert('Selecciona un archivo CSV primero.');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: false,   // conservar filas vacías si existen
      dynamicTyping: false,    // parseamos manualmente para mantener strings
      complete: (res) => {
        // PapaParse puede añadir una fila final vacía; no la eliminamos automáticamente,
        // porque tu CLI original también contaba filas y podía mostrar nulos.
        data = res.data.map(r => {
          // mantener exactamente las columnas leídas
          return r;
        });
        headers = res.meta.fields || [];
        alert(`CSV cargado: ${data.length} filas, ${headers.length} columnas`);
        renderWelcome();
      },
      error: (err) => alert('Error leyendo CSV: ' + err)
    });
  };

  exportBtn.onclick = () => {
    if (!data.length) return alert('No hay datos para exportar');
    const csv = Papa.unparse(data, { quotes: false });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'export.csv';
    link.click();
  };

  // ---- render helpers ----
  function renderWelcome() {
    content.innerHTML = `<p>CSV cargado. Usa las opciones del menú para ejecutar operaciones (1-12).</p>
    <small class="note">Columnas detectadas: <strong>${headers.join(', ')}</strong></small>`;
  }

  function renderTable(showRows = null) {
    // showRows: null => mostrar todas; if number => show first n
    if (!headers.length) { content.innerHTML = '<p>Carga un CSV primero.</p>'; return; }
    const rows = (showRows && Number(showRows) > 0) ? data.slice(0, Number(showRows)) : data;
    let html = `<div class="controls-row">
        <button id="btn_show_all">Mostrar todo</button>
        <button id="btn_show_first">Mostrar primeras N</button>
        <input id="input_n" class="input-inline" placeholder="N" style="width:80px">
        <button id="btn_refresh">Refrescar tabla</button>
      </div>`;
    html += `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}<th>Acciones</th></tr></thead><tbody>`;
    rows.forEach((row, i) => {
      html += `<tr>`;
      headers.forEach(h => {
        const val = row[h] === undefined || row[h] === null ? '' : String(row[h]);
        html += `<td contenteditable onblur="window._updateCell(${i}, '${escapeQuotes(h)}', this.innerText)">${escapeHtml(val)}</td>`;
      });
      html += `<td><button onclick="window._deleteRow(${i})">Eliminar</button></td></tr>`;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;

    document.getElementById('btn_show_all').onclick = () => renderTable();
    document.getElementById('btn_show_first').onclick = () => {
      const n = Number(document.getElementById('input_n').value || 5);
      renderTable(n);
    };
    document.getElementById('btn_refresh').onclick = () => renderTable(showRows);
  }

  // expose update/delete to global because contenteditable uses onblur inline
  window._updateCell = (rowIndex, col, value) => {
    if (rowIndex < 0 || rowIndex >= data.length) return;
    // Si fila no tiene la columna (p.e. filas importadas con columnas faltantes), creamos la clave
    if (!(col in data[rowIndex])) data[rowIndex][col] = null;
    data[rowIndex][col] = value;
  };

  window._deleteRow = (i) => {
    if (!confirm('¿Eliminar fila index ' + i + '?')) return;
    data.splice(i, 1);
    renderTable();
  };

  // ---- 1. Mostrar primeras filas ----
  mapBtn[1].onclick = () => {
    if (!data.length) return alert('Carga un CSV primero');
    const n = prompt('¿Cuántas filas mostrar? (Dejar en blanco = 5)', '5');
    const nn = Number(n || 5);
    renderTable(nn);
  };

  // ---- 2. Agregar fila (CREATE) ----
  mapBtn[2].onclick = () => {
    if (!headers.length) return alert('Carga un CSV primero.');
    let html = `<h3>Agregar fila</h3><div id="addForm">`;
    headers.forEach(h => html += `<div><label>${h}: </label><input id="a_${escapeQuotes(h)}" class="input-inline"></div>`);
    html += `</div><div style="margin-top:10px"><button id="add_save">Guardar fila</button></div>`;
    content.innerHTML = html;
    document.getElementById('add_save').onclick = () => {
      const newRow = {};
      headers.forEach(h => newRow[h] = document.getElementById(`a_${h}`).value || '');
      data.push(newRow);
      alert('Fila agregada.');
      renderTable();
    };
  };

  // ---- 3. Actualizar fila (UPDATE) ----
  mapBtn[3].onclick = () => {
    if (!data.length) return alert('No hay filas para actualizar');
    const idx = Number(prompt('Índice a actualizar (0..' + (data.length - 1) + '):'));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice fuera de rango');
    let html = `<h3>Actualizar fila ${idx}</h3><div id="updForm">`;
    headers.forEach(h => {
      const cur = data[idx][h] ?? '';
      html += `<div><label>${h} (actual: ${escapeHtml(String(cur))}): </label><input id="u_${escapeQuotes(h)}" class="input-inline"></div>`;
    });
    html += `</div><div style="margin-top:10px"><button id="upd_save">Aplicar cambios</button></div>`;
    content.innerHTML = html;
    document.getElementById('upd_save').onclick = () => {
      const updates = {};
      headers.forEach(h => {
        const v = document.getElementById(`u_${h}`).value;
        if (v !== '') updates[h] = v;
      });
      Object.keys(updates).forEach(k => data[idx][k] = updates[k]);
      alert('Fila actualizada.');
      renderTable();
    };
  };

  // ---- 4. Borrar fila (DELETE) ----
  mapBtn[4].onclick = () => {
    if (!data.length) return alert('No hay filas para borrar');
    const idx = Number(prompt('Índice a borrar (0..' + (data.length - 1) + '):'));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice fuera de rango');
    if (!confirm('¿Borrar fila ' + idx + '?')) return;
    data.splice(idx, 1);
    alert('Fila borrada.');
    renderTable();
  };

  // ---- 5. Buscar texto en columna ----
  mapBtn[5].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const col = prompt('Columna a buscar:');
    if (!col) return;
    if (!headers.includes(col)) return alert('Columna no encontrada');
    const txt = prompt('Texto a buscar (case-insensitive):');
    const res = data.filter(r => String(r[col] ?? '').toLowerCase().includes((txt || '').toLowerCase()));
    content.innerHTML = `<h3>Resultados búsqueda en columna <strong>${col}</strong></h3>`;
    renderSearchResults(res);
  };

  // ---- 6. Filtrar filas (expresión lambda simple) ----
  mapBtn[6].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const expr = prompt('Escribe una expresión que use `row`, p.ej: Number(row["Puntaje"])>3');
    if (!expr) return;
    try {
      // construir función segura mínima
      const fn = new Function('row', `with(row){ return (${expr}); }`);
      const res = data.filter(r => {
        try { return Boolean(fn(r)); } catch (e) { return false; }
      });
      content.innerHTML = `<h3>Filtrado por expresión</h3>`;
      renderSearchResults(res);
    } catch (e) {
      alert('Error en expresión: ' + e.message);
    }
  };

  // ---- 7. Ordenar por columna ----
  mapBtn[7].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const col = prompt('Columna para ordenar:');
    if (!col) return;
    const asc = confirm('Orden ascendente? (Aceptar = ascendente, Cancelar = descendente)');
    try {
      data.sort((a, b) => {
        const va = a[col], vb = b[col];
        const na = toNum(va), nb = toNum(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return asc ? na - nb : nb - na;
        const sa = String(va ?? ''), sb = String(vb ?? '');
        return asc ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
      alert('Orden aplicado.');
      renderTable();
    } catch (e) {
      alert('Error al ordenar: ' + e);
    }
  };

  // ---- 8. Consultas/predefinidas (15) ----
  mapBtn[8].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    let html = `<h3>Consultas predefinidas (15)</h3>
      <div class="controls-row">
        <button id="c1">a) Total filas</button>
        <button id="c2">b) Lista columnas</button>
        <button id="c3">c) Conteo nulos por columna</button>
        <button id="c4">d) Media columna</button>
        <button id="c5">e) Suma columna</button>
        <button id="c6">f) Min-Max columna</button>
        <button id="c7">g) Conteo por categoría</button>
        <button id="c8">h) Top N frecuencias</button>
        <button id="c9">i) Filtrar por umbral</button>
        <button id="c10">j) Buscar keywords</button>
        <button id="c11">k) Pipeline: sumar > umbral</button>
        <button id="c12">l) Correlación</button>
        <button id="c13">m) Filas únicas por columna</button>
        <button id="c14">n) Reemplazar valores por mapeo</button>
        <button id="c15">o) Resumen reducido</button>
      </div>
      <div id="cResult"></div>`;
    content.innerHTML = html;

    const resDiv = el('cResult');

    el('c1').onclick = () => resDiv.innerHTML = `<pre>${q_total_rows()}</pre>`;
    el('c2').onclick = () => resDiv.innerHTML = `<pre>${JSON.stringify(q_column_list(), null, 2)}</pre>`;
    el('c3').onclick = () => resDiv.innerHTML = `<pre>${JSON.stringify(q_null_counts(), null, 2)}</pre>`;
    el('c4').onclick = () => {
      const col = prompt('Columna para media:');
      try { resDiv.innerHTML = `<pre>${q_mean(col)}</pre>`; } catch (e) { alert(e); }
    };
    el('c5').onclick = () => {
      const col = prompt('Columna para suma:');
      try { resDiv.innerHTML = `<pre>${q_sum(col)}</pre>`; } catch (e) { alert(e); }
    };
    el('c6').onclick = () => {
      const col = prompt('Columna para min/max:');
      try { resDiv.innerHTML = `<pre>${JSON.stringify(q_min_max(col))}</pre>`; } catch (e) { alert(e); }
    };
    el('c7').onclick = () => {
      const col = prompt('Columna para conteo por categoría:');
      try { resDiv.innerHTML = `<pre>${JSON.stringify(q_value_counts(col), null, 2)}</pre>`; } catch (e) { alert(e); }
    };
    el('c8').onclick = () => {
      const col = prompt('Columna para Top N:');
      const n = Number(prompt('Top N [5]:', '5'));
      resDiv.innerHTML = `<pre>${JSON.stringify(q_top_n(col, n), null, 2)}</pre>`;
    };
    el('c9').onclick = () => {
      const col = prompt('Columna:'); const th = Number(prompt('Umbral:'));
      resDiv.innerHTML = `<pre>${JSON.stringify(q_filter_threshold(col, th).slice(0,50), null, 2)}\n\n(mostrando hasta 50 filas)</pre>`;
    };
    el('c10').onclick = () => {
      const cols = prompt('Columnas separadas por coma:').split(',').map(s=>s.trim());
      const kw = prompt('Keyword:');
      const df = q_search_keywords(cols, kw);
      resDiv.innerHTML = `<pre>${JSON.stringify(df.slice(0,50), null, 2)}\n\n(mostrando hasta 50 filas)</pre>`;
    };
    el('c11').onclick = () => {
      const col = prompt('Columna:'); const th = Number(prompt('Umbral:'));
      resDiv.innerHTML = `<pre>${q_pipeline_sum_above(col, th)}</pre>`;
    };
    el('c12').onclick = () => {
      const c1 = prompt('Columna X:'), c2 = prompt('Columna Y:');
      try { resDiv.innerHTML = `<pre>Correlación: ${q_correlation(c1, c2)}</pre>`; } catch (e) { alert(e); }
    };
    el('c13').onclick = () => {
      const col = prompt('Columna:');
      resDiv.innerHTML = `<pre>${JSON.stringify(q_unique_rows(col).slice(0,50), null, 2)}\n\n(mostrando hasta 50 filas)</pre>`;
    };
    el('c14').onclick = () => {
      const col = prompt('Columna:');
      const mapStr = prompt('Ingrese mapping en formato JSON, p.ej: {"Yes":"Si","No":"No"}');
      try {
        const mp = JSON.parse(mapStr);
        q_replace_map(col, mp);
        alert('Reemplazos aplicados.');
      } catch (e) { alert('JSON inválido'); }
    };
    el('c15').onclick = () => resDiv.innerHTML = `<pre>${JSON.stringify(q_reduce_summary(), null, 2)}</pre>`;
  };

  // ---- 9. Estadísticas y resumen ----
  mapBtn[9].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    let html = `<h3>Resumen y estadísticas</h3><div><button id="showSummary">Mostrar resumen (describe)</button>
      <button id="showMissing">Valores nulos por columna</button></div>
      <div id="statsRes"></div>`;
    content.innerHTML = html;
    el('showSummary').onclick = () => {
      el('statsRes').innerHTML = `<pre>${summary()}</pre>`;
    };
    el('showMissing').onclick = () => {
      el('statsRes').innerHTML = `<pre>${JSON.stringify(missing_summary(), null, 2)}</pre>`;
    };
  };

  // ---- 10. Exportar CSV ----
  mapBtn[10].onclick = () => exportBtn.click();

  // ---- 11. Gráficos ----
  mapBtn[11].onclick = () => {
    if (!data.length) return alert('Carga un CSV');
    const cols = headers.join(', ');
    let html = `<h3>Gráficos</h3>
      <div class="controls-row">
        <label>Histograma (columna):</label>
        <select id="histCol">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
        <label>Bins:</label><input id="histBins" class="input-inline" value="10" style="width:60px">
        <button id="drawHist">Dibujar histograma</button>
      </div>
      <div class="controls-row" style="margin-top:10px">
        <label>Scatter X:</label><select id="scX">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
        <label>Y:</label><select id="scY">${headers.map(h=>`<option>${h}</option>`).join('')}</select>
        <button id="drawSc">Dibujar scatter</button>
      </div>
      <div id="chartContainer"><canvas id="chartCanvas"></canvas></div>`;
    content.innerHTML = html;

    el('drawHist').onclick = () => {
      const col = el('histCol').value;
      const bins = Number(el('histBins').value) || 10;
      drawHistogram(col, bins);
    };
    el('drawSc').onclick = () => {
      const x = el('scX').value; const y = el('scY').value;
      drawScatter(x, y);
    };
  };

  // ---- 12. Abrir GUI (opcional) ----
  mapBtn[12].onclick = () => {
    // en este entorno no abrimos Tkinter; mostramos la GUI web ya implementada
    alert('GUI opcional: la interfaz web ya funciona en el navegador.');
    renderTable();
  };

  // ---- 0. Salir (limpiar sesión) ----
  mapBtn[0].onclick = () => {
    if (!confirm('Limpiar datos en memoria y reiniciar?')) return;
    data = []; headers = [];
    content.innerHTML = `<p>Sesión reiniciada.</p>`;
  };

  // ------------------ Implementación de consultas y utilidades ------------------

  function q_total_rows() {
    // reduce(map(range(len(df)),1)) equivalente -> length
    return data.reduce((acc,_) => acc + 1, 0);
  }

  function q_column_list() { return headers.slice(); }

  function q_null_counts() {
    const counts = {};
    headers.forEach(h => counts[h] = data.reduce((acc,r) => acc + ((r[h] === null || r[h] === undefined || r[h]==='') ? 1 : 0), 0));
    return counts;
  }

  function q_mean(column) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
  }

  function q_sum(column) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    return vals.reduce((a,b)=>a+b,0);
  }

  function q_min_max(column) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v));
    if (!vals.length) return [null, null];
    return [Math.min(...vals), Math.max(...vals)];
  }

  function q_value_counts(column) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    return data.reduce((acc,r)=>{
      const v = (r[column] === null || r[column] === undefined || r[column]==='') ? 'NULL' : r[column];
      acc[v] = (acc[v] || 0) + 1; return acc;
    }, {});
  }

  function q_top_n(column, n=5) {
    const vc = q_value_counts(column);
    return Object.entries(vc).sort((a,b)=>b[1]-a[1]).slice(0,n);
  }

  function q_filter_threshold(column, threshold) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    return data.filter(r => {
      const v = toNum(r[column]);
      return !Number.isNaN(v) && v > threshold;
    });
  }

  function q_search_keywords(columns, keyword) {
    const kw = (keyword||'').toLowerCase();
    return data.filter(r => columns.some(c => String(r[c] ?? '').toLowerCase().includes(kw)));
  }

  function q_pipeline_sum_above(column, threshold) {
    const seq = data.map(r => r[column]);
    const nums = seq.filter(x => !Number.isNaN(toNum(x)) && toNum(x) > threshold).map(x=>toNum(x));
    return nums.reduce((a,b)=>a+b,0);
  }

  function q_correlation(c1, c2) {
    if (!headers.includes(c1) || !headers.includes(c2)) throw 'Columnas no encontradas';
    const x = data.map(r => toNum(r[c1])).filter((v,i)=>!Number.isNaN(v) && !Number.isNaN(toNum(data[i][c2])));
    // make aligned arrays
    const pairs = data.map(r=>[toNum(r[c1]), toNum(r[c2])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (pairs.length < 2) return null;
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
    const mx = mean(xs), my = mean(ys);
    let num = 0, denx = 0, deny = 0;
    for (let i=0;i<xs.length;i++){
      num += (xs[i]-mx)*(ys[i]-my);
      denx += (xs[i]-mx)**2;
      deny += (ys[i]-my)**2;
    }
    const denom = Math.sqrt(denx*deny);
    return denom === 0 ? 0 : num/denom;
  }

  function q_unique_rows(column) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    const seen = new Set();
    const out = [];
    for (const r of data) {
      let v = r[column];
      if (v === null || v === undefined || v === '') v = 'NULL';
      if (!seen.has(v)) { seen.add(v); out.push(r); }
    }
    return out;
  }

  function q_replace_map(column, mapping) {
    if (!headers.includes(column)) throw `Columna ${column} no encontrada`;
    data = data.map(r => {
      const val = r[column];
      r[column] = (val in mapping) ? mapping[val] : val;
      return r;
    });
  }

  function q_reduce_summary() {
    return headers.reduce((acc,c) => {
      acc[c] = { non_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?0:1),0), n_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?1:0),0) };
      return acc;
    }, {});
  }

  // ---- stats helpers ----
  function summary() {
    // basic describe: for numeric columns compute count, mean, std, min, 25/50/75, max; for others count unique
    const out = {};
    headers.forEach(h => {
      const nums = data.map(r=>toNum(r[h])).filter(v=>!Number.isNaN(v));
      if (nums.length){
        nums.sort((a,b)=>a-b);
        const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
        const std = Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/nums.length);
        const q = (arr,p)=> {
          const idx = (arr.length-1)*p; const lo = Math.floor(idx); const hi = Math.ceil(idx);
          if (lo===hi) return arr[lo]; return arr[lo]*(hi-idx)+arr[hi]*(idx-lo);
        };
        out[h] = { count: nums.length, mean, std, min: nums[0], q25: q(nums,0.25), median: q(nums,0.5), q75: q(nums,0.75), max: nums[nums.length-1] };
      } else {
        const uniq = new Set(data.map(r=>r[h]).filter(x=>x!==undefined && x!==null && x!==''));
        out[h] = { count: data.length, unique: uniq.size };
      }
    });
    return JSON.stringify(out, null, 2);
  }

  function missing_summary() {
    return q_null_counts();
  }

  // ---- gráficos ----
  let chartInstance = null;
  function drawHistogram(column, bins=10) {
    // tomar valores numéricos
    const vals = data.map(r => toNum(r[column])).filter(v => !Number.isNaN(v));
    if (!vals.length) return alert('No hay valores numéricos en esa columna');
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const binSize = range / bins;
    // crear bins
    const counts = new Array(bins).fill(0);
    vals.forEach(v => {
      let idx = Math.floor((v - min) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    });
    const labels = counts.map((_,i) => {
      const a = min + i*binSize;
      const b = (i === bins-1) ? max : (min + (i+1)*binSize);
      return `${round(a,3)} - ${round(b,3)}`;
    });

    const ctx = el('chartCanvas').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: `Histograma: ${column}`, data: counts }] },
      options: { responsive: true, scales: { x: { ticks: { autoSkip: false } } } }
    });
  }

  function drawScatter(xcol, ycol) {
    const pairs = data.map(r => [toNum(r[xcol]), toNum(r[ycol])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (!pairs.length) return alert('No hay pares numéricos para graficar.');
    const xs = pairs.map(p => p[0]);
    const ys = pairs.map(p => p[1]);
    const plotData = pairs.map((p,i) => ({ x: p[0], y: p[1] }));
    const ctx = el('chartCanvas').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: [{ label: `${xcol} vs ${ycol}`, data: plotData, showLine: false }] },
      options: { responsive: true, scales: { x: { title: { display: true, text: xcol } }, y: { title: { display: true, text: ycol } } } }
    });
  }

  // ---- utilidades pequeñas ----
  function renderSearchResults(rows) {
    if (!rows || !rows.length) { content.innerHTML += '<p>No hay coincidencias.</p>'; return; }
    let html = `<p>Resultados: ${rows.length} filas</p><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r, i) => {
      html += '<tr>';
      headers.forEach(h => html += `<td>${escapeHtml(String(r[h] ?? ''))}</td>`);
      html += `<td>—</td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML += html;
  }

  function missing_summary_obj() { return q_null_counts(); }

  // small utils
  function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function escapeQuotes(s){ return s.replaceAll("'", "\\'").replaceAll('"','\\"'); }
  function round(v, d=2){ return Math.round(v * (10**d))/(10**d); }

  function missing_summary() { return q_null_counts(); }

  // expose some funcs to console for debugging
  window.__CSV = { data, headers, q_total_rows, q_column_list };

  // End onload
};

