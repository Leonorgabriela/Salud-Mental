window.onload = () => {
  let data = [];
  let headers = [];

  const fileInput = document.getElementById("fileInput");
  const loadBtn = document.getElementById("loadBtn");
  const exportBtn = document.getElementById("exportBtn");
  const content = document.getElementById("content");

  const btnVer = document.getElementById("btnVer");
  const btnAdd = document.getElementById("btnAdd");
  const btnConsultas = document.getElementById("btnConsultas");
  const btnStats = document.getElementById("btnStats");

  // -------------------- EVENTOS DE BOTONES --------------------
  loadBtn.onclick = () => {
    const file = fileInput.files[0];
    if (!file) return alert("Selecciona un archivo CSV");
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        data = res.data.filter(r => Object.values(r).some(v => v !== null && v !== ""));
        headers = res.meta.fields;
        alert("CSV cargado correctamente ✅");
        showTable();
      }
    });
  };

  exportBtn.onclick = () => {
    if (!data.length) return alert("No hay datos para exportar");
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "export.csv";
    link.click();
  };

  btnVer.onclick = () => showTable();
  btnAdd.onclick = () => showAddForm();
  btnConsultas.onclick = () => showQueries();
  btnStats.onclick = () => showStats();

  // -------------------- FUNCIONES --------------------
  function showTable() {
    if (!data.length) return content.innerHTML = "<p>No hay datos cargados.</p>";

    let html = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}<th>Acción</th></tr></thead><tbody>`;
    data.forEach((row, i) => {
      html += "<tr>";
      headers.forEach(h => html += `<td contenteditable onblur="updateCell(${i}, '${h}', this.innerText)">${row[h] ?? ""}</td>`);
      html += `<td><button onclick="deleteRow(${i})">🗑️</button></td></tr>`;
    });
    html += "</tbody></table>";
    content.innerHTML = html;
  }

  window.updateCell = (row, col, val) => {
    data[row][col] = val;
  };

  window.deleteRow = (i) => {
    if (confirm("¿Eliminar esta fila?")) {
      data.splice(i, 1);
      showTable();
    }
  };

  function showAddForm() {
    if (!headers.length) return content.innerHTML = "<p>Carga un CSV primero.</p>";
    let html = `<h3>Agregar nueva fila</h3><div id="formAdd">`;
    headers.forEach(h => html += `<input placeholder="${h}" id="new_${h}">`);
    html += `</div><button id="addBtn">Agregar</button>`;
    content.innerHTML = html;
    document.getElementById("addBtn").onclick = addRow;
  }

  function addRow() {
    const newRow = {};
    headers.forEach(h => newRow[h] = document.getElementById(`new_${h}`).value);
    data.push(newRow);
    showTable();
  }

  function showQueries() {
    content.innerHTML = `
      <h3>Consultas</h3>
      <button id="qTotal">Total de filas</button>
      <button id="qCols">Lista de columnas</button>
      <button id="qMean">Promedio columna</button>
      <div id="result"></div>
    `;
    document.getElementById("qTotal").onclick = () => showResult(`Total de filas: ${data.length}`);
    document.getElementById("qCols").onclick = () => showResult(`Columnas: ${headers.join(", ")}`);
    document.getElementById("qMean").onclick = () => {
      const col = prompt("Columna numérica:");
      const nums = data.map(r => parseFloat(r[col])).filter(x => !isNaN(x));
      if (!nums.length) return alert("No hay valores numéricos");
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      showResult(`Promedio de ${col}: ${avg.toFixed(2)}`);
    };
  }

  function showResult(txt) {
    document.getElementById("result").innerHTML = `<pre>${txt}</pre>`;
  }

  function showStats() {
    if (!headers.length) return content.innerHTML = "<p>Carga un CSV primero.</p>";
    content.innerHTML = `
      <h3>Estadísticas</h3>
      <select id="colSelect">${headers.map(h => `<option>${h}</option>`)}</select>
      <button id="chartBtn">Graficar</button>
      <div id="chartContainer"><canvas id="chart"></canvas></div>
    `;
    document.getElementById("chartBtn").onclick = drawChart;
  }

  function drawChart() {
    const col = document.getElementById("colSelect").value;
    const vals = data.map(r => parseFloat(r[col])).filter(x => !isNaN(x));
    if (!vals.length) return alert("No hay datos numéricos para graficar");
    const ctx = document.getElementById("chart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: vals.map((_, i) => i + 1),
        datasets: [{ label: col, data: vals }]
      },
      options: { responsive: true }
    });
  }
};
