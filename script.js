let data = [];
let headers = [];

document.getElementById("loadBtn").addEventListener("click", () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Selecciona un archivo CSV");
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: (res) => {
      data = res.data.filter(r => Object.values(r).some(v => v !== null && v !== ""));
      headers = res.meta.fields;
      showTable();
    }
  });
});

function showTable() {
  const div = document.getElementById("content");
  if (!data.length) return div.innerHTML = "<p>No hay datos cargados.</p>";

  let html = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}<th>Acciones</th></tr></thead><tbody>`;
  data.forEach((row, i) => {
    html += "<tr>";
    headers.forEach(h => {
      html += `<td contenteditable onblur="updateCell(${i}, '${h}', this.innerText)">${row[h] ?? ''}</td>`;
    });
    html += `<td><button onclick="deleteRow(${i})">🗑️</button></td></tr>`;
  });
  html += "</tbody></table>";
  div.innerHTML = html;
}

function updateCell(row, col, val) {
  data[row][col] = val;
}

function deleteRow(i) {
  if (confirm("¿Eliminar fila?")) {
    data.splice(i, 1);
    showTable();
  }
}

function showAddForm() {
  const div = document.getElementById("content");
  if (!headers.length) return div.innerHTML = "<p>Carga un CSV primero.</p>";

  let html = `<h3>Agregar nueva fila</h3><div id="addForm">`;
  headers.forEach(h => html += `<input placeholder="${h}" id="new_${h}" />`);
  html += `</div><button onclick="addRow()">Agregar</button>`;
  div.innerHTML = html;
}

function addRow() {
  const newRow = {};
  headers.forEach(h => newRow[h] = document.getElementById(`new_${h}`).value);
  data.push(newRow);
  showTable();
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "export.csv";
  link.click();
});

// -------------------- CONSULTAS (simulan map/filter/reduce) --------------------

function showQueries() {
  const div = document.getElementById("content");
  div.innerHTML = `
    <h3>Consultas</h3>
    <button onclick="qTotalRows()">Total de filas</button>
    <button onclick="qColumnList()">Lista de columnas</button>
    <button onclick="qNullCounts()">Conteo nulos</button>
    <button onclick="qMean()">Promedio columna</button>
    <button onclick="qMinMax()">Mínimo/Máximo</button>
    <div id="queryResult"></div>
  `;
}

function qTotalRows() {
  showQuery(`Total de filas: ${data.length}`);
}

function qColumnList() {
  showQuery(`Columnas: ${headers.join(', ')}`);
}

function qNullCounts() {
  const res = {};
  headers.forEach(h => res[h] = data.filter(r => !r[h]).length);
  showQuery(JSON.stringify(res, null, 2));
}

function qMean() {
  const col = prompt("Nombre de la columna numérica:");
  const vals = data.map(r => parseFloat(r[col])).filter(x => !isNaN(x));
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  showQuery(`Promedio de ${col}: ${avg.toFixed(2)}`);
}

function qMinMax() {
  const col = prompt("Columna numérica:");
  const vals = data.map(r => parseFloat(r[col])).filter(x => !isNaN(x));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  showQuery(`Min: ${min}, Max: ${max}`);
}

function showQuery(txt) {
  document.getElementById("queryResult").innerHTML = `<pre>${txt}</pre>`;
}

// -------------------- ESTADÍSTICAS Y GRÁFICOS --------------------

function showStats() {
  const div = document.getElementById("content");
  if (!headers.length) return div.innerHTML = "<p>Carga un CSV primero.</p>";

  let html = `<h3>Estadísticas</h3>
  <select id="colSelect">${headers.map(h => `<option>${h}</option>`)}</select>
  <button onclick="drawHistogram()">Histograma</button>
  <div id="chartContainer"><canvas id="chart"></canvas></div>`;
  div.innerHTML = html;
}

function drawHistogram() {
  const col = document.getElementById("colSelect").value;
  const vals = data.map(r => parseFloat(r[col])).filter(x => !isNaN(x));
  const ctx = document.getElementById("chart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: vals,
      datasets: [{ label: col, data: vals }]
    },
    options: { responsive: true }
  });
}
