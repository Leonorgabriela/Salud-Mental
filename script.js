// script.js - UI completa que replica el menú CLI
window.addEventListener('DOMContentLoaded', () => {
  // In-memory data
  let data = [];
  let headers = [];
  let chartInstance = null;

  // DOM
  const fileInput = document.getElementById('fileInput');
  const loadBtn = document.getElementById('loadBtn');
  const exportBtn = document.getElementById('exportBtn');
  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const sub = document.getElementById('sub');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // helpers
  const el = id => document.getElementById(id);
  const escape = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const toNum = v => (v === null || v === undefined || v === '') ? NaN : Number(v);
  const isNum = v => !Number.isNaN(toNum(v));

  // modal helpers
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
  }
  function closeModal() {
    modal.classList.add('hidden');
    modalBody.innerHTML = '';
  }
  modalClose.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  // load CSV
  loadBtn.onclick = () => {
    const file = fileInput.files[0];
    if (!file) return alert('Selecciona un CSV primero');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: false,
      dynamicTyping: false,
      complete: (res) => {
        data = res.data.map(r => r);
        headers = res.meta.fields || [];
        title.textContent = 'CSV cargado';
        sub.textContent = `${data.length} filas — ${headers.length} columnas`;
        renderTable();
      },
      error: err => alert('Error leyendo CSV: ' + err)
    });
  };

  // export
  exportBtn.onclick = () => {
    if (!data.length) return alert('No hay datos para exportar');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'export.csv'; a.click();
  };

  // Menu buttons (delegation)
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleAction(action);
    });
  });

  // Main action router (1..12,0)
  function handleAction(action) {
    if (action !== '0' && !['1','2','3','4','5','6','7','8','9','10','11','12'].includes(action)) return;
    if (action !== '0' && !data.length && !['10','12'].includes(action)) {
      return alert('Carga un CSV para usar esa opción.');
    }
    switch (action) {
      case '1': menuShowHead(); break;
      case '2': menuAddRow(); break;
      case '3': menuUpdateRow(); break;
      case '4': menuDeleteRow(); break;
      case '5': menuSearch(); break;
      case '6': menuFilterExpr(); break;
      case '7': menuSort(); break;
      case '8': menuQueries(); break;
      case '9': menuStats(); break;
      case '10': exportBtn.click(); break;
      case '11': menuGraphs(); break;
      case '12': renderTable(); break;
      case '0': if (confirm('Limpiar datos en memoria?')) { data = []; headers = []; content.innerHTML = '<p>Sesión reiniciada.</p>'; title.textContent='Bienvenida'; sub.textContent='Carga un CSV para comenzar.'; } break;
      default: break;
    }
  }

  /* ------------------------------
     Helpers for rendering table
     ------------------------------ */
  function renderTable(n = null) {
    if (!headers.length) {
      content.innerHTML = '<p class="muted">No hay CSV cargado.</p>';
      return;
    }
    const rows = (n && Number(n) > 0) ? data.slice(0, Number(n)) : data;
    let html = `<div class="controls-row">
      <button id="showAll" class="btn">Mostrar todo</button>
      <button id="showFirst" class="btn ghost">Mostrar primeras N</button>
      <input id="inputN" class="input-inline" placeholder="N" style="width:80px">
      <button id="refresh" class="btn ghost">Refrescar</button>
    </div>`;
    html += `<table><thead><tr>${headers.map(h => `<th>${escape(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r,i) => {
      html += `<tr>`;
      headers.forEach(h => html += `<td contenteditable onblur="window._updateCell(${i}, '${h.replaceAll("'", "\\'")}', this.innerText)">${escape(r[h] ?? '')}</td>`);
      html += `<td><button class="btn ghost" onclick="window._deleteRow(${i})">Eliminar</button></td></tr>`;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;

    document.getElementById('showAll').onclick = () => renderTable();
    document.getElementById('showFirst').onclick = () => {
      const k = Number(document.getElementById('inputN').value || 5);
      renderTable(k);
    };
    document.getElementById('refresh').onclick = () => renderTable(n);
  }

  // expose update/delete globally (needed for inline handlers)
  window._updateCell = (idx, col, val) => {
    if (idx < 0 || idx >= data.length) return;
    if (!(col in data[idx])) data[idx][col] = '';
    data[idx][col] = val;
  };
  window._deleteRow = (idx) => {
    if (!confirm(`Eliminar fila ${idx}?`)) return;
    data.splice(idx,1);
    renderTable();
  };

  /* ------------------------------
     Menu implementations
     ------------------------------ */

  // 1. Mostrar primeras filas
  function menuShowHead() {
    const n = Number(prompt('¿Cuántas filas mostrar? (default 5)', '5') || 5);
    renderTable(n);
  }

  // 2. Agregar fila
  function menuAddRow() {
    if (!headers.length) return alert('No hay CSV cargado');
    const formHtml = `<h3>Agregar fila</h3><div style="display:flex;flex-direction:column;gap:8px">` +
      headers.map(h => `<div><label>${escape(h)}: </label><input id="f_${h}" class="input-inline"></div>`).join('') +
      `</div><div style="margin-top:12px"><button id="saveAdd" class="btn">Guardar</button></div>`;
    openModal(formHtml);
    document.getElementById('saveAdd').onclick = () => {
      const row = {};
      headers.forEach(h => row[h] = document.getElementById(`f_${h}`).value || '');
      data.push(row);
      closeModal();
      renderTable();
    };
  }

  // 3. Actualizar fila
  function menuUpdateRow() {
    const idx = Number(prompt(`Índice a actualizar (0 .. ${data.length-1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    let html = `<h3>Actualizar fila ${idx}</h3><div style="display:flex;flex-direction:column;gap:8px">`;
    headers.forEach(h => html += `<div><label>${escape(h)} (actual: ${escape(String(data[idx][h] ?? ''))}): </label><input id="u_${h}" class="input-inline"></div>`);
    html += `</div><div style="margin-top:12px"><button id="saveUpd" class="btn">Aplicar</button></div>`;
    openModal(html);
    document.getElementById('saveUpd').onclick = () => {
      headers.forEach(h => {
        const v = document.getElementById(`u_${h}`).value;
        if (v !== '') data[idx][h] = v;
      });
      closeModal();
      renderTable();
    };
  }

  // 4. Borrar fila
  function menuDeleteRow() {
    const idx = Number(prompt(`Índice a borrar (0 .. ${data.length-1}):`));
    if (Number.isNaN(idx) || idx < 0 || idx >= data.length) return alert('Índice inválido');
    if (confirm(`Borrar fila ${idx}?`)) {
      data.splice(idx,1);
      renderTable();
    }
  }

  // 5. Buscar texto en columna
  function menuSearch() {
    const col = prompt('Columna a buscar:');
    if (!col) return;
    if (!headers.includes(col)) return alert('Columna no encontrada');
    const txt = prompt('Texto a buscar (case-insensitive):') || '';
    const res = data.filter(r => String(r[col] ?? '').toLowerCase().includes(txt.toLowerCase()));
    content.innerHTML = `<h3>Resultados búsqueda (${res.length})</h3>`;
    renderSearch(res);
  }

  // 6. Filtrar por expresión (usa Function; cuidado si sitio público)
  function menuFilterExpr() {
    const expr = prompt('Escribe expresión usando row, p.ej: Number(row["Puntaje"])>3');
    if (!expr) return;
    try {
      const fn = new Function('row', `try{return (${expr});}catch(e){return false;}`);
      const res = data.filter(r => fn(r));
      content.innerHTML = `<h3>Filtrado (${res.length})</h3>`;
      renderSearch(res);
    } catch (e) { alert('Expresión inválida'); }
  }

  // 7. Ordenar por columna
  function menuSort() {
    const col = prompt('Columna para ordenar:');
    if (!col) return;
    const asc = confirm('Orden ascendente? Aceptar=asc, Cancelar=desc');
    data.sort((a,b) => {
      const na = toNum(a[col]), nb = toNum(b[col]);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return asc ? na - nb : nb - na;
      return asc ? String(a[col] ?? '').localeCompare(String(b[col] ?? '')) : String(b[col] ?? '').localeCompare(String(a[col] ?? ''));
    });
    renderTable();
  }

  // 8. Consultas/predefinidas (15)
  function menuQueries() {
    const html = `<h3>Consultas predefinidas</h3>
      <div class="controls-row" style="flex-wrap:wrap">
        <button id="c1" class="btn">a) Total filas</button>
        <button id="c2" class="btn">b) Lista columnas</button>
        <button id="c3" class="btn">c) Conteo nulos</button>
        <button id="c4" class="btn">d) Media columna</button>
        <button id="c5" class="btn">e) Suma columna</button>
        <button id="c6" class="btn">f) Min-Max</button>
        <button id="c7" class="btn">g) Conteo por categoría</button>
        <button id="c8" class="btn">h) Top N</button>
        <button id="c9" class="btn">i) Filtrar > umbral</button>
        <button id="c10" class="btn">j) Buscar keywords</button>
        <button id="c11" class="btn">k) Pipeline sumar > umbral</button>
        <button id="c12" class="btn">l) Correlación</button>
        <button id="c13" class="btn">m) Filas únicas</button>
        <button id="c14" class="btn">n) Reemplazar por mapping</button>
        <button id="c15" class="btn">o) Resumen reducido</button>
      </div>
      <div id="qResult"></div>`;
    content.innerHTML = html;

    const r = document.getElementById('qResult');
    document.getElementById('c1').onclick = () => r.innerHTML = `<pre>${q_total_rows()}</pre>`;
    document.getElementById('c2').onclick = () => r.innerHTML = `<pre>${JSON.stringify(q_column_list(), null,2)}</pre>`;
    document.getElementById('c3').onclick = () => r.innerHTML = `<pre>${JSON.stringify(q_null_counts(), null,2)}</pre>`;
    document.getElementById('c4').onclick = () => { const c = prompt('Columna para media:'); r.innerHTML = `<pre>${q_mean(c)}</pre>`; };
    document.getElementById('c5').onclick = () => { const c = prompt('Columna para suma:'); r.innerHTML = `<pre>${q_sum(c)}</pre>`; };
    document.getElementById('c6').onclick = () => { const c = prompt('Columna min/max:'); r.innerHTML = `<pre>${JSON.stringify(q_min_max(c),null,2)}</pre>`; };
    document.getElementById('c7').onclick = () => { const c = prompt('Columna para conteo:'); r.innerHTML = `<pre>${JSON.stringify(q_value_counts(c),null,2)}</pre>`; };
    document.getElementById('c8').onclick = () => { const c = prompt('Columna Top N:'); const n = Number(prompt('Top N [5]','5')); r.innerHTML = `<pre>${JSON.stringify(q_top_n(c,n),null,2)}</pre>`; };
    document.getElementById('c9').onclick = () => { const c = prompt('Columna:'), th = Number(prompt('Umbral:')); r.innerHTML = `<pre>${JSON.stringify(q_filter_threshold(c,th).slice(0,50),null,2)}\n\n(mostrando hasta 50)</pre>`; };
    document.getElementById('c10').onclick = () => { const cols = prompt('Columnas separadas por coma:').split(',').map(s=>s.trim()); const kw = prompt('Keyword:'); r.innerHTML = `<pre>${JSON.stringify(q_search_keywords(cols,kw).slice(0,50),null,2)}</pre>`; };
    document.getElementById('c11').onclick = () => { const c = prompt('Columna:'), th = Number(prompt('Umbral:')); r.innerHTML = `<pre>${q_pipeline_sum_above(c,th)}</pre>`; };
    document.getElementById('c12').onclick = () => { const c1 = prompt('Columna X:'), c2 = prompt('Columna Y:'); r.innerHTML = `<pre>Correlación: ${q_correlation(c1,c2)}</pre>`; };
    document.getElementById('c13').onclick = () => { const c = prompt('Columna:'); r.innerHTML = `<pre>${JSON.stringify(q_unique_rows(c).slice(0,50),null,2)}</pre>`; };
    document.getElementById('c14').onclick = () => { const c = prompt('Columna:'), mp = prompt('Mapping JSON (ej: {"Yes":"Si"}):'); try { q_replace_map(c, JSON.parse(mp)); alert('Reemplazo aplicado'); } catch(e){ alert('JSON inválido'); } };
    document.getElementById('c15').onclick = () => { r.innerHTML = `<pre>${JSON.stringify(q_reduce_summary(), null,2)}</pre>`; };
  }

  // 9. Estadísticas y resumen
  function menuStats() {
    const html = `<h3>Estadísticas</h3><div id="statOut"><pre>${summary()}</pre></div>`;
    content.innerHTML = html;
  }

  // 11. Gráficos
  function menuGraphs() {
    if (!headers.length) return alert('Carga un CSV');
    const html = `<h3>Gráficos</h3>
      <div class="controls-row">
        <label>Histograma:</label>
        <select id="histCol">${headers.map(h => `<option>${h}</option>`).join('')}</select>
        <label>Bins:</label><input id="histBins" class="input-inline" value="10" style="width:80px">
        <button id="doHist" class="btn">Dibujar</button>
      </div>
      <div class="controls-row">
        <label>Scatter X:</label>
        <select id="scX">${headers.map(h => `<option>${h}</option>`).join('')}</select>
        <label>Y:</label>
        <select id="scY">${headers.map(h => `<option>${h}</option>`).join('')}</select>
        <button id="doSc" class="btn">Dibujar scatter</button>
      </div>
      <div id="chartWrapper"><canvas id="chartCanvas"></canvas></div>`;
    content.innerHTML = html;
    document.getElementById('doHist').onclick = () => drawHistogram(document.getElementById('histCol').value, Number(document.getElementById('histBins').value) || 10);
    document.getElementById('doSc').onclick = () => drawScatter(document.getElementById('scX').value, document.getElementById('scY').value);
  }

  /* ------------------------------
     Implementations of the 15 queries
     ------------------------------ */
  function q_total_rows(){ return data.length; }
  function q_column_list(){ return headers.slice(); }
  function q_null_counts(){ const out = {}; headers.forEach(h => out[h] = data.reduce((s, r) => s + ((r[h]===undefined||r[h]===null||r[h]==='')?1:0), 0)); return out; }
  function q_mean(column){ if (!headers.includes(column)) throw 'Columna no encontrada'; const vals = data.map(r => toNum(r[column])).filter(v=>!Number.isNaN(v)); return vals.length? vals.reduce((a,b)=>a+b,0)/vals.length : null; }
  function q_sum(column){ if (!headers.includes(column)) throw 'Columna no encontrada'; return data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v)).reduce((a,b)=>a+b,0); }
  function q_min_max(column){ if (!headers.includes(column)) throw 'Columna no encontrada'; const vals = data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v)); return vals.length? [Math.min(...vals), Math.max(...vals)] : [null,null]; }
  function q_value_counts(column){ if (!headers.includes(column)) throw 'Columna no encontrada'; return data.reduce((acc,r)=>{ const v = (r[column]===undefined||r[column]===null||r[column]==='')?'NULL':r[column]; acc[v] = (acc[v]||0)+1; return acc; }, {}); }
  function q_top_n(column,n=5){ const vc = q_value_counts(column); return Object.entries(vc).sort((a,b)=>b[1]-a[1]).slice(0,n); }
  function q_filter_threshold(column,threshold){ if (!headers.includes(column)) throw 'Columna no encontrada'; return data.filter(r=>{ const v=toNum(r[column]); return !Number.isNaN(v)&&v>threshold; }); }
  function q_search_keywords(columns,keyword){ const kw=(keyword||'').toLowerCase(); return data.filter(r=>columns.some(c=>String(r[c]??'').toLowerCase().includes(kw))); }
  function q_pipeline_sum_above(column,threshold){ return data.map(r=>toNum(r[column])).filter(v=>!Number.isNaN(v)&&v>threshold).reduce((a,b)=>a+b,0); }
  function q_correlation(c1,c2){ if (!headers.includes(c1)||!headers.includes(c2)) throw 'Columnas no encontradas'; const pairs = data.map(r=>[toNum(r[c1]),toNum(r[c2])]).filter(p=>!Number.isNaN(p[0])&&!Number.isNaN(p[1])); if (pairs.length<2) return null; const xs=pairs.map(p=>p[0]), ys=pairs.map(p=>p[1]); const mean=arr=>arr.reduce((a,b)=>a+b,0)/arr.length; const mx=mean(xs), my=mean(ys); let num=0,dx=0,dy=0; for(let i=0;i<xs.length;i++){ num+=(xs[i]-mx)*(ys[i]-my); dx+=(xs[i]-mx)**2; dy+=(ys[i]-my)**2;} const denom=Math.sqrt(dx*dy); return denom===0?0:num/denom; }
  function q_unique_rows(column){ if (!headers.includes(column)) throw 'Columna no encontrada'; const seen=new Set(); const out=[]; for(const r of data){ let v=r[column]; if(v===undefined||v===null||v==='') v='NULL'; if(!seen.has(v)){ seen.add(v); out.push(r);} } return out; }
  function q_replace_map(column,mapping){ if (!headers.includes(column)) throw 'Columna no encontrada'; data = data.map(r => { r[column] = (r[column] in mapping) ? mapping[r[column]] : r[column]; return r; }); }
  function q_reduce_summary(){ return headers.reduce((acc,c)=>{ acc[c] = { non_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?0:1),0), n_nulls: data.reduce((s,r)=>s + ((r[c]===undefined||r[c]===null||r[c]==='')?1:0),0)}; return acc; }, {}); }

  // summary for stats (describe-ish)
  function summary(){
    const out = {};
    headers.forEach(h=>{
      const nums = data.map(r=>toNum(r[h])).filter(v=>!Number.isNaN(v));
      if (nums.length){
        nums.sort((a,b)=>a-b);
        const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
        const std = Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/nums.length);
        const q = (arr,p)=>{ const idx=(arr.length-1)*p; const lo=Math.floor(idx), hi=Math.ceil(idx); return lo===hi?arr[lo]:(arr[lo]*(hi-idx)+arr[hi]*(idx-lo)); };
        out[h] = { count: nums.length, mean: mean, std: std, min: nums[0], q25: q(nums,0.25), median: q(nums,0.5), q75: q(nums,0.75), max: nums[nums.length-1] };
      } else {
        const uniq = new Set(data.map(r=>r[h]).filter(x=>x!==undefined&&x!==null&&x!=='')); out[h] = { count: data.length, unique: uniq.size };
      }
    });
    return JSON.stringify(out, null, 2);
  }

  // renderSearch helper
  function renderSearch(rows){
    if (!rows || !rows.length) { content.innerHTML = '<p>No hay coincidencias.</p>'; return; }
    let html = `<p>Resultados: ${rows.length} filas</p><table><thead><tr>${headers.map(h=>`<th>${escape(h)}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
    rows.forEach((r,idx) => {
      html += '<tr>';
      headers.forEach(h => html += `<td>${escape(String(r[h] ?? ''))}</td>`);
      html += `<td>—</td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML = html;
  }

  /* ------------------------------
     Charts: histogram & scatter
     ------------------------------ */
  function drawHistogram(column, bins = 10) {
    const vals = data.map(r => toNum(r[column])).filter(v => !Number.isNaN(v));
    if (!vals.length) return alert('No hay valores numéricos en la columna');
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = (max - min) || 1; const binSize = range / bins;
    const counts = new Array(bins).fill(0);
    vals.forEach(v => {
      let idx = Math.floor((v - min) / binSize); if (idx < 0) idx = 0; if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    });
    const labels = counts.map((_,i) => `${(min + i*binSize).toFixed(3)} - ${(i===bins-1?max:(min+(i+1)*binSize)).toFixed(3)}`);
    renderChart({ labels, datasets:[{ label:`Histograma ${column}`, data: counts }] }, 'bar');
  }

  function drawScatter(xcol,ycol) {
    const pairs = data.map(r => [toNum(r[xcol]), toNum(r[ycol])]).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
    if (!pairs.length) return alert('No hay pares numéricos válidos para graficar');
    const plot = pairs.map(p => ({ x: p[0], y: p[1] }));
    renderChart({ datasets:[{ label:`${xcol} vs ${ycol}`, data: plot }] }, 'scatter');
  }

  function renderChart(chartData, type) {
    const canvas = document.getElementById('chartCanvas') || (() => { content.innerHTML += `<div id="chartWrapper"><canvas id="chartCanvas"></canvas></div>`; return document.getElementById('chartCanvas'); })();
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, { type, data: chartData, options: { responsive: true } });
  }

  // expose minimal debug
  window.__CSV = { getData: () => data, getHeaders: () => headers };

});

