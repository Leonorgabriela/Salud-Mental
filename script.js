let data = [];
let headers = [];

const el = id => document.getElementById(id);
const show = html => (el("content").innerHTML = html);

// === MODO OSCURO ===
el("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// === CARGAR CSV ===
el("loadBtn").addEventListener("click", () => {
  const file = el("fileInput").files[0];
  if (!file) return alert("Selecciona un archivo CSV primero.");
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      data = results.data.filter(r => Object.keys(r).length > 1);
      headers = results.meta.fields;
      show("<p>✅ Archivo cargado correctamente. Usa el menú para explorar.</p>");
    }
  });
});

// === EXPORTAR CSV ===
el("exportBtn").addEventListener("click", () => {
  if (!data.length) return alert("Nada que exportar.");
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "exported_data.csv";
  link.click();
});

// === MOSTRAR TABLA ===
function renderTable(rows) {
  if (!rows.length) return show("<p>Sin resultados.</p>");
  let html = "<table><thead><tr>";
  headers.forEach(h => (html += `<th>${h}</th>`));
  html += "</tr></thead><tbody>";
  rows.forEach(r => {
    html += "<tr>";
    headers.forEach(h => (html += `<td>${r[h] ?? ""}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  show(html);
}

// === 1. Mostrar primeras filas ===
el("opt1").addEventListener("click", () => {
  if (!data.length) return alert("Carga primero un CSV.");
  renderTable(data.slice(0, 10));
});

// === 2. Agregar fila ===
el("opt2").addEventListener("click", () => {
  if (!headers.length) return alert("Carga un CSV primero.");
  const newRow = {};
  headers.forEach(h => {
    const val = prompt(`Valor para "${h}"`);
    newRow[h] = val;
  });
  data.push(newRow);
  alert("Fila agregada.");
  renderTable(data.slice(-5));
});

// === 3. Actualizar fila ===
el("opt3").addEventListener("click", () => {
  if (!data.length) return alert("Primero carga un CSV.");
  const i = parseInt(prompt("Índice (0,1,2...) de la fila a actualizar:"));
  if (isNaN(i) || !data[i]) return alert("Índice inválido.");
  headers.forEach(h => {
    const nuevo = prompt(`Nuevo valor para ${h} (actual: ${data[i][h]})`);
    if (nuevo !== "") data[i][h] = nuevo;
  });
  renderTable([data[i]]);
});

// === 4. Borrar fila ===
el("opt4").addEventListener("click", () => {
  if (!data.length) return alert("Carga un CSV primero.");
  const i = parseInt(prompt("Índice (0,1,2...) a eliminar:"));
  if (isNaN(i) || !data[i]) return alert("Índice inválido.");
  data.splice(i, 1);
  alert("Fila eliminada.");
  renderTable(data.slice(0, 5));
});

// === 5. Buscar texto ===
el("opt5").addEventListener("click", () => {
  if (!data.length) return alert("Carga un CSV primero.");
  const col = prompt("Columna a buscar:");
  const txt = prompt("Texto a buscar:");
  const res = data.filter(r => (r[col] + "").toLowerCase().includes(txt.toLowerCase()));
  renderTable(res);
});

// === 6. Filtrar filas ===
el("opt6").addEventListener("click", () => {
  if (!data.length) return alert("Carga un CSV primero.");
  const expr = prompt("Expresión JS (ej: row.Age > 20 && row.Gender==='Male')");
  try {
    const res = data.filter(row => eval(expr));
    renderTable(res);
  } catch {
    alert("Expresión inválida.");
  }
});

// === 7. Ordenar columna ===
el("opt7").addEventListener("click", () => {
  const col = prompt("Columna para ordenar:");
  if (!col || !headers.includes(col)) return alert("Columna inválida.");
  data.sort((a, b) => (a[col] > b[col] ? 1 : -1));
  renderTable(data.slice(0, 10));
});

// === 8. Estadísticas ===
el("opt8").addEventListener("click", () => {
  const col = prompt("Columna numérica:");
  const nums = data.map(r => Number(r[col])).filter(n => !isNaN(n));
  if (!nums.length) return alert("Columna no numérica o vacía.");
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  show(`<h3>📈 Estadísticas de "${col}"</h3>
        <p>Promedio: ${avg.toFixed(2)}</p>
        <p>Mínimo: ${min}</p>
        <p>Máximo: ${max}</p>`);
});

// === 9. Gráfico ===
el("opt9").addEventListener("click", () => {
  const col = prompt("Columna numérica para graficar:");
  const nums = data.map(r => Number(r[col])).filter(n => !isNaN(n));
  if (!nums.length) return alert("Columna no válida.");
  show(`<h3>📊 Gráfico de ${col}</h3><canvas id="chart"></canvas>`);
  const ctx = el("chart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: nums.map((_, i) => i + 1),
      datasets: [{ label: col, data: nums, backgroundColor: "rgba(0,123,255,0.6)" }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
});

