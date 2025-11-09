let data = [];
let headers = [];

function loadCSV() {
  const file = document.getElementById("csvFile").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseCSV(text);
    renderTable(data);
    populateColumnSelect();
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.split("\n").filter(line => line.trim() !== "");
  headers = lines[0].split(",");
  data = lines.slice(1).map(line => {
    const values = line.split(",");
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] || "";
      return obj;
    }, {});
  });
}

function renderTable(rows) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  rows.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = row[h];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function populateColumnSelect() {
  const select = document.getElementById("columnSelect");
  select.innerHTML = "";
  headers.forEach(h => {
    const option = document.createElement("option");
    option.value = h;
    option.textContent = h;
    select.appendChild(option);
  });
}

function searchTable() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const column = document.getElementById("columnSelect").value;
  const filtered = data.filter(row =>
    row[column].toLowerCase().includes(keyword)
  );
  renderTable(filtered);
}

function resetTable() {
  renderTable(data);
}

// Opcional: gráfico de frecuencias
function renderChart(column) {
  const counts = {};
  data.forEach(row => {
    const val = row[column] || "NULL";
    counts[val] = (counts[val] || 0) + 1;
  });

  const ctx = document.getElementById("chartCanvas").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: `Frecuencia de ${column}`,
        data: Object.values(counts),
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }]
    }
  });
}


