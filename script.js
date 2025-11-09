let data = [];
let headers = [];
const content = document.getElementById("content");
const fileInput = document.getElementById("fileInput");

// Helper para mostrar en pantalla
function show(msg) {
  content.innerHTML = msg;
}

// Renderiza tabla
function renderTable(rows = data) {
  if (!rows.length) return show("<p>No hay datos cargados.</p>");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  rows.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = headers.map(h => `<td>${r[h]}</td>`).join("");
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  content.innerHTML = "";
  content.appendChild(table);
}

// Cargar CSV
document.getElementById("loadBtn").addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona un archivo CSV primero.");
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: (res) => {
      data = res.data.filter(r => Object.keys(r).length > 0);
      headers = Object.keys(data[0]);
      show("<h3>CSV cargado correctamente ✅</h3>");
      renderTable(data.slice(0, 5));
    },
  });
});

// Exportar CSV
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!data.length) return alert("No hay datos para exportar.");
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data_export.csv";
  link.click();
});

// Mostrar primeras filas
document.getElementById("opt1").addEventListener("click", () => {
  if (!data.length) return alert("Carga un CSV primero.");
  renderTable(data.slice(0, 5));
});

// Agregar fila
document.getElementById("opt2").addEventListener("click", () => {
  if (!headers.length) return alert("Carga un CSV primero.");
  const newRow = {};
  headers.forEach(h => newRow[h] = prompt(`Valor para ${h}:`) || "");
  data.push(newRow);
  renderTable(data.slice(-5));
});

// Actualizar fila
document.getElementById("opt3").addEventListener("click", () => {
  if (!data.length) return alert("Carga un CSV primero.");
  const idx = parseInt(prompt("Índice de la fila a actualizar (empezando en 0):"));
  if (isNaN(idx) || idx < 0 || idx >= data.length) return alert("Índice inválido.");
  headers.forEach(h => {
    const val = prompt(`Nuevo valor para ${h} (actual: ${data[idx][h]})`);
    if (val !== null && val !== "") data[idx][h] = val;
  });
  renderTable(data.slice(idx, idx + 1));
});

// Borrar fila
document.getElementById("opt4").addEventListener("click", () => {
  const idx = parseInt(prompt("Índice de la fila a borrar:"));
  if (isNaN(idx) || idx < 0 || idx >= data.length) return alert("Índice inválido.");
  data.splice(idx, 1);
  renderTable(data.slice(0, 5));
});

// Buscar texto
document.getElementById("opt5").addEventListener("click", () => {
  const col = prompt("Columna para buscar:");
  const text = prompt("Texto a buscar:");
  if (!col || !text) return;
  const result = data.filter(r => String(r[col]).includes(text));
  show(`<p>${result.length} coincidencias encontradas.</p>`);
  renderTable(result.slice(0, 10));
});

// Filtrar filas (expresión JS)
document.getElementById("opt6").addEventListener("click", () => {
  const expr = prompt("Expresión de filtro (ej: row.Age > 20 && row.Gender=='Male'):");
  if (!expr) return;
  const result = data.filter(row => eval(expr));
  show(`<p>${result.length} filas cumplen la condición.</p>`);
  renderTable(result.slice(0, 10));
});

// Ordenar por columna
document.getElementById("opt7").addEventListener("click", () => {
  const col = prompt("Columna para ordenar:");
  if (!col) return;
  data.sort((a, b) => (a[col] > b[col] ? 1 : -1));
  renderTable(data.slice(0, 10));
});

// Estadísticas simples
document.getElementById("opt8").addEventListener("click", () => {
  const col = prompt("Columna numérica para calcular promedio:");
  const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
  const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
  show(`<h3>Promedio de ${col}: ${avg.toFixed(2)}</h3>`);
});

// Gráfico simple
document.getElementById("opt9").addEventListener("click", () => {
  const col = prompt("Columna numérica para graficar:");
  const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
  content.innerHTML = `<h3>Gráfico de ${col}</h3><canvas id="chart"></canvas>`;
  const ctx = document.getElementById("chart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: vals.map((_,i)=>i+1),
      datasets: [{ label: col, data: vals }]
    }
  });
});
