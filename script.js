window.onload = () => {
  let data = [];
  let headers = [];

  const fileInput = document.getElementById("fileInput");
  const loadBtn = document.getElementById("loadBtn");
  const exportBtn = document.getElementById("exportBtn");
  const content = document.getElementById("content");

  // ===================== CARGA DEL CSV =====================
  loadBtn.onclick = () => {
    const file = fileInput.files[0];
    if (!file) return alert("Selecciona un archivo CSV primero");

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        data = res.data.filter(r => Object.values(r).some(v => v !== ""));
        headers = res.meta.fields;
        alert("✅ CSV cargado correctamente");
        showTable(data.slice(0, 10)); // mostrar primeras filas
      }
    });
  };

  // ===================== EXPORTAR =====================
  exportBtn.onclick = () => {
    if (!data.length) return alert("No hay datos para exportar");
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exportado.csv";
    link.click();
  };

  // ===================== MENÚ PRINCIPAL =====================
  document.querySelectorAll("#menu button").forEach(btn => {
    btn.onclick = () => handleAction(btn.dataset.action);
  });

  function handleAction(action) {
    if (!data.length && action !== "load") {
      return alert("Carga primero un archivo CSV.");
    }
    const actions = {
      showHead: () => showTable(data.slice(0, 10)),
      addRow: showAddForm,
      updateRow: showUpdateForm,
      deleteRow: showDeleteForm,
      search: showSearch,
      filter: showFilter,
      sort: showSort,
      queries: showQueries,
      stats: showStats,
      export: () => exportBtn.onclick(),
      graph: showGraph,
      gui: () => showTable(data)
    };
    actions[action]?.();
  }

  // ===================== FUNCIONES =====================

  function showTable(arr) {
    if (!arr.length) return (content.innerHTML = "<p>Sin datos para mostrar.</p>");
    let html = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
    arr.forEach(row => {
      html += "<tr>";
      headers.forEach(h => html += `<td>${row[h] ?? ""}</td>`);
      html += "</tr>";
    });
    html += "</tbody></table>";
    content.innerHTML = html;
  }

  function showAddForm() {
    let html = `<h3>Agregar Fila</h3>`;
    headers.forEach(h => (html += `<input placeholder="${h}" id="new_${h}">`));
    html += `<button id="addBtn">Agregar</button>`;
    content.innerHTML = html;
    document.getElementById("addBtn").onclick = () => {
      const newRow = {};
      headers.forEach(h => newRow[h] = document.getElementById(`new_${h}`).value);
      data.push(newRow);
      alert("Fila agregada ✅");
      showTable(data.slice(-10));
    };
  }

  function showUpdateForm() {
    let index = parseInt(prompt("Número de fila a actualizar (empezando en 1):")) - 1;
    if (isNaN(index) || index < 0 || index >= data.length) return alert("Índice inválido");
    headers.forEach(h => {
      const val = prompt(`Nuevo valor para '${h}' (actual: ${data[index][h] ?? ""})`);
      if (val !== null) data[index][h] = val;
    });
    alert("Fila actualizada ✅");
    showTable(data.slice(index, index + 1));
  }

  function showDeleteForm() {
    let index = parseInt(prompt("Número de fila a eliminar:")) - 1;
    if (isNaN(index) || index < 0 || index >= data.length) return alert("Índice inválido");
    if (confirm("¿Eliminar fila seleccionada?")) {
      data.splice(index, 1);
      alert("Fila eliminada ✅");
      showTable(data.slice(0, 10));
    }
  }

  function showSearch() {
    const col = prompt("Columna donde buscar:");
    const term = prompt("Texto a buscar:");
    const results = data.filter(r => String(r[col]).includes(term));
    content.innerHTML = `<h3>Resultados de búsqueda (${results.length})</h3>`;
    showTable(results);
  }

  function showFilter() {
    const expr = prompt("Escribe una expresión (ej: row.Edad > 20 && row.Puntaje < 4)");
    try {
      const filtered = data.filter(row => eval(expr));
      showTable(filtered);
    } catch (e) {
      alert("Expresión no válida");
    }
  }

  function showSort() {
    const col = prompt("Columna para ordenar:");
    const dir = prompt("asc o desc:", "asc");
    const sorted = [...data].sort((a, b) => {
      if (a[col] > b[col]) return dir === "asc" ? 1 : -1;
      if (a[col] < b[col]) return dir === "asc" ? -1 : 1;
      return 0;
    });
    showTable(sorted);
  }

  function showQueries() {
    let msg = `
1️⃣ Promedio de una columna numérica\n
2️⃣ Contar valores únicos en una columna\n
3️⃣ Máximo y mínimo\n
4️⃣ Filtrar mayores al promedio\n
`;
    const opt = prompt(msg);
    if (opt === "1") {
      const col = prompt("Columna numérica:");
      const vals = data.map(r => +r[col]).filter(x => !isNaN(x));
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      alert(`Promedio de ${col}: ${avg.toFixed(2)}`);
    } else if (opt === "2") {
      const col = prompt("Columna:");
      const uniq = [...new Set(data.map(r => r[col]))];
      alert(`Valores únicos (${uniq.length}): ${uniq.join(", ")}`);
    } else if (opt === "3") {
      const col = prompt("Columna numérica:");
      const vals = data.map(r => +r[col]).filter(x => !isNaN(x));
      alert(`Máx: ${Math.max(...vals)} | Mín: ${Math.min(...vals)}`);
    } else if (opt === "4") {
      const col = prompt("Columna numérica:");
      const vals = data.map(r => +r[col]).filter(x => !isNaN(x));
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const res = data.filter(r => r[col] > avg);
      showTable(res);
    }
  }

  function showStats() {
    let html = `<h3>Estadísticas</h3>`;
    headers.forEach(h => {
      const vals = data.map(r => +r[h]).filter(x => !isNaN(x));
      if (vals.length) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        html += `<p>${h}: promedio=${avg.toFixed(2)}, máx=${Math.max(...vals)}, mín=${Math.min(...vals)}</p>`;
      }
    });
    content.innerHTML = html;
  }

  function showGraph() {
    const col = prompt("Columna numérica para graficar:");
    const vals = data.map(r => +r[col]).filter(x => !isNaN(x));
    if (!vals.length) return alert("No hay valores numéricos válidos");
    content.innerHTML = `<canvas id="chart"></canvas>`;
    const ctx = document.getElementById("chart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: vals.map((_, i) => i + 1),
        datasets: [{ label: col, data: vals, borderWidth: 1 }]
      },
      options: { responsive: true }
    });
  }
};
