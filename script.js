let data = [];
let headers = [];

// Utilidad para obtener elementos
const el = id => document.getElementById(id);

// Mostrar contenido dinámico
function show(html) {
  el("content").innerHTML = html;
}

// Cargar CSV desde input
el("loadBtn").addEventListener("click", () => {
  const file = el("fileInput").files[0];
  if (!file) return alert("Selecciona un archivo CSV primero.");
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      data = results.data.filter(row => Object.keys(row).length > 1);
      headers = results.meta.fields;
      show("<p>Archivo cargado correctamente.</p>");
    }
  });
});

// Mostrar primeras filas
el("opt1").addEventListener("click", () => {
  if (data.length === 0) return alert("Primero carga un CSV.");
  const first = data.slice(0, 5);
  renderTable(first);
});

// Agregar fila
el("opt2").addEventListener("click", () => {
  if (!headers.length) return alert("Primero carga un CSV.");
  let newRow = {};
  headers.forEach(h => {
    const val = prompt(`Valor para "${h}":`);
    newRow[h] = val;
  });
  data.push(newRow);
  alert("Fila agregada.");
  renderTable(data.slice(-5));
});

// Actualizar fila
el("opt3").addEventListener("click", () => {
  const index = parseInt(prompt("Índice (0,1,2...) a actualizar:"));
  if (isNaN(index) || !data[index]) return alert("Índice inválido.");
  headers.forEach(h => {
    const val = prompt(`Nuevo valor para "${h}" (actual: ${data[index][h]}):`);
    if (val !== "") data[index][h] = val;
  });
  renderTable([data[index]]);
});

// Borrar fila
el("opt4").addEventListener("click", () => {
  const index = parseInt(prompt("Índice (0,1,2...) a borrar:"));
  if (isNaN(index) || !data[index]) return alert("Índice inválido.");
  data.splice(index, 1);
  alert("Fila eliminada.");
  renderTable(data.slice(0, 5));
});

// Buscar texto en columna
el("opt5").addEventListener("click", () => {
  const col = prompt("Columna:");
  const txt = prompt("Texto a buscar:");
  const results = data.filter(r => (r[col] + "").includes(txt));
  renderTable(results);
});

// Filtrar con expresión JS
el("opt6").addEventListener("click", () => {
  const expr = prompt('Escribe una expresión JS, ejemplo: "row.Age > 20 && row.Gender === \'Male\'"');
  try {
    const results = data.filter(row => eval(expr));
    renderTable(results);
  } catch (e) {
    alert("Expresión inválida.");
  }
});

// Ordenar por columna
el("opt7").addEventListener("click", () => {
  const col = prompt("Columna para ordenar:");
  data.sort((a, b) => (a[col] > b[col] ? 1 : -1));
  renderTable(data.slice(0, 10));
});

// Estadísticas
el("opt8").addEventListener("click", () => {
  const col = prompt("Columna numérica:");
  const nums = data.map(r => Number(r[col])).filter(v => !isNaN(v));
  if (!nums.length) return alert("Columna no válida.");
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  show(`<h3>Estadísticas para ${col}</h3>
        <p>Promedio: ${avg.toFixed(2)}</p>
        <p>Mínimo: ${min}</p>
        <p>Máximo: ${max}</p>`);
});

// Gráficos
el("opt9").addEventListener("click", () => {
  const col = prompt("Columna numérica para graficar:");
  const nums = data.map(r => Number(r[col])).filter(v => !isNaN(v));
  if (!nums.length) return alert("Columna inválida o no numérica.");

  show(`<h3>Gráfico de ${col}</h3><canvas id="chart"></canvas>`);
  const ctx = el("chart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: nums.map((_, i) => i + 1),
      datasets: [{ label: col, data: nums }]
    }
  });
});

// Exportar CSV
el("exportBtn").addEventListener("click", () => {
  if (!data.length) return alert("Nada para exportar.");
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exported_data.csv";
  a.click();
});

// Renderizar tabla
function renderTable(rows) {
  let html = "<table><thead><tr>";
  headers.forEach(h => (html += `<th>${h}</th>`));
  html += "</tr></thead><tbody>";
  rows.forEach((r, i) => {
    html += "<tr>";
    headers.forEach(h => (html += `<td>${r[h]}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  show(html);
}
