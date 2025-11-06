let data = [];
let headers = [];

document.getElementById('loadBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) {
    alert("Selecciona un archivo CSV primero.");
    return;
  }
  Papa.parse(fileInput.files[0], {
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      data = results.data.filter(row => Object.values(row).some(v => v !== null && v !== ""));
      headers = results.meta.fields;
      renderTable();
      renderAddRowForm();
    }
  });
});

function renderTable() {
  const container = document.getElementById('tableContainer');
  if (data.length === 0) {
    container.innerHTML = "<p>No hay datos cargados.</p>";
    return;
  }

  let html = "<table><thead><tr>";
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "<th>Acciones</th></tr></thead><tbody>";

  data.forEach((row, i) => {
    html += "<tr>";
    headers.forEach(h => {
      html += `<td contenteditable onblur="updateCell(${i}, '${h}', this.innerText)">${row[h]}</td>`;
    });
    html += `<td><button onclick="deleteRow(${i})">🗑️</button></td></tr>`;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderAddRowForm() {
  const addDiv = document.getElementById('addRow');
  addDiv.innerHTML = "";
  headers.forEach(h => {
    const input = document.createElement('input');
    input.placeholder = h;
    input.dataset.field = h;
    input.type = "text";
    addDiv.appendChild(input);
  });
}

document.getElementById('addRowBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('#addRow input');
  const newRow = {};
  inputs.forEach(input => newRow[input.dataset.field] = input.value);
  data.push(newRow);
  renderTable();
});

function updateCell(rowIndex, field, value) {
  data[rowIndex][field] = value;
}

function deleteRow(i) {
  if (confirm("¿Eliminar esta fila?")) {
    data.splice(i, 1);
    renderTable();
  }
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "export.csv";
  link.click();
});
