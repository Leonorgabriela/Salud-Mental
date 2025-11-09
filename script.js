let data = [];
let headers = [];
const tableContainer = document.getElementById('table-container');
const chartCanvas = document.getElementById('chartCanvas');
let chart;

// 📂 Leer CSV
document.getElementById('fileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split('\n').map(l => l.split(','));
    headers = lines[0];
    data = lines.slice(1).filter(row => row.length === headers.length);
    renderTable(data.slice(0, 5));
  };
  reader.readAsText(file);
});

// 📋 Renderizar tabla
function renderTable(rows) {
  if (!rows.length) {
    tableContainer.innerHTML = '<p>No hay datos para mostrar.</p>';
    return;
  }
  const html = `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  tableContainer.innerHTML = html;
}

// 🎯 Acciones de menú
document.querySelectorAll('#menu button').forEach(btn => {
  btn.addEventListener('click', () => handleAction(btn.dataset.action));
});

function handleAction(action) {
  switch(action) {
    case 'show': renderTable(data.slice(0, 5)); break;
    case 'stats': showStats(); break;
    case 'chart': showChart(); break;
    case 'export': exportCSV(); break;
    default: alert('Acción aún no implementada.');
  }
}

// 📈 Estadísticas básicas
function showStats() {
  const numericCols = getNumericColumns();
  if (numericCols.length === 0) return alert('No hay columnas numéricas.');

  const stats = numericCols.map(col => {
    const idx = headers.indexOf(col);
    const nums = data.map(r => parseFloat(r[idx])).filter(n => !isNaN(n));
    const avg = (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2);
    const min = Math.min(...nums).toFixed(2);
    const max = Math.max(...nums).toFixed(2);
    return `<p><b>${col}</b> → Promedio: ${avg}, Min: ${min}, Max: ${max}</p>`;
  }).join('');
  tableContainer.innerHTML = stats;
}

// 📊 Gráfico simple
function showChart() {
  const numericCols = getNumericColumns();
  if (numericCols.length < 1) return alert('Se necesita al menos una columna numérica.');
  const col = numericCols[0];
  const idx = headers.indexOf(col);
  const nums = data.map(r => parseFloat(r[idx])).filter(n => !isNaN(n));

  if (chart) chart.destroy();
  chart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: nums.map((_, i) => i + 1),
      datasets: [{
        label: col,
        data: nums
      }]
    }
  });
}

// 🧮 Ayuda: columnas numéricas
function getNumericColumns() {
  return headers.filter((h, i) => data.every(r => !isNaN(parseFloat(r[i])) || r[i] === ''));
}

// 💾 Exportar CSV
function exportCSV() {
  const csvContent = [headers.join(',')].concat(data.map(r => r.join(','))).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'export.csv';
  a.click();
}

