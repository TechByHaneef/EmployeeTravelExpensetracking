const addBtn = document.getElementById("addExpense");
const exportBtn = document.getElementById("exportExcel");
const tableBody = document.getElementById("expenseTable");
const totalEl = document.getElementById("total");
const setTravelerBtn = document.getElementById("setTraveler");
const travelerNameDisplay = document.getElementById("travelerNameDisplay");
const travelerNameInput = document.getElementById("travelerNameInput");

let db;
let travelerName = localStorage.getItem("travelerName") || "";

// --- IndexedDB Setup ---
const request = indexedDB.open("TravelDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("records")) {
    db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  renderRecords();
};

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

// --- Employee Name ---
if (travelerName) {
  travelerNameDisplay.textContent = "Employee: " + travelerName;
  travelerNameInput.style.display = "none";
  setTravelerBtn.style.display = "none";
}

setTravelerBtn.addEventListener("click", () => {
  const inputName = travelerNameInput.value;
  if (inputName) {
    travelerName = inputName;
    travelerNameDisplay.textContent = "Employee: " + travelerName;
    localStorage.setItem("travelerName", travelerName);

    travelerNameInput.style.display = "none";
    setTravelerBtn.style.display = "none";
  }
});


// --- Render Records ---
function renderRecords() {
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    tableBody.innerHTML = "";
    let total = 0;

    records.forEach((rec) => {
      // If amount is missing, show "N/A"
      const amountDisplay = rec.amount !== undefined && rec.amount !== null ? rec.amount : "N/A";
      if (typeof rec.amount === "number") total += rec.amount;

      const row = `
        <tr>
          <td>${rec.date}</td>
          <td>${rec.from}</td>
          <td>${rec.to}</td>
          <td>${rec.method}</td>
          <td>${rec.customerName}</td>
          <td>${amountDisplay}</td>
          <td>
            <button onclick="deleteRecord(${rec.id})">Delete</button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });

    totalEl.textContent = total.toFixed(2);
  };
}

// --- Add Record ---
addBtn.addEventListener("click", () => {
  const today = new Date().toISOString().split("T")[0];
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const method = document.getElementById("method").value;
  const customerName = document.getElementById("customerName").value;
  const amountValue = document.getElementById("amount").value;
  const amount = amountValue ? parseFloat(amountValue) : null; // optional

  if (from && to && method && travelerName && customerName) {
    const record = {
      date: today,
      from,
      to,
      method,
      customerName,
      amount, // may be null
      traveler: travelerName
    };

    const tx = db.transaction("records", "readwrite");
    const store = tx.objectStore("records");
    store.add(record);

    tx.oncomplete = () => renderRecords();
  } else {
    alert("Please fill required fields and set traveler name first.");
  }
});

// --- Delete Record ---
function deleteRecord(id) {
  const tx = db.transaction("records", "readwrite");
  const store = tx.objectStore("records");
  store.delete(id);

  tx.oncomplete = () => renderRecords();
}

// --- Export to Excel ---
exportBtn.addEventListener("click", () => {
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }

    // Replace null amounts with "N/A" for export
    const exportData = records.map(rec => ({
      ...rec,
      amount: rec.amount !== null && rec.amount !== undefined ? rec.amount : "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Records");

    XLSX.writeFile(workbook, "Travel_Records.xlsx");
  };
});

// --- Export to Excel ---
exportBtn.addEventListener("click", () => {
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }

    // Remove the "id" field before exporting
    const exportData = records.map(({ id, ...rest }) => ({
      ...rest,
      amount: rest.amount !== null && rest.amount !== undefined ? rest.amount : "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Records");

    XLSX.writeFile(workbook, "Travel_Records.xlsx");
  };
});
function autoMonthlyReset() {
  const today = new Date();
  if (today.getDate() === 1) {
    const tx = db.transaction("records", "readonly");
    const store = tx.objectStore("records");
    const request = store.getAll();

    request.onsuccess = function () {
      const records = request.result;
      if (records.length > 0) {
        // Export last month’s data
        const exportData = records.map(({ id, ...rest }) => ({
          ...rest,
          amount: rest.amount ?? "N/A"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Records");

        const lastMonth = today.getMonth(); // 0-based
        const year = today.getFullYear();
        const fileName = `Travel_Records_${year}_${lastMonth}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        // Clear records
        const clearTx = db.transaction("records", "readwrite");
        clearTx.objectStore("records").clear();
        clearTx.oncomplete = () => {
          renderRecords();
          alert("Last month’s records exported and cleared.");
        };
      }
    };
  }
}

// Call this when app loads
request.onsuccess = function (event) {
  db = event.target.result;
  renderRecords();
  autoMonthlyReset();
};
const row = `
  <tr>
    <td data-label="Date">${rec.date}</td>
    <td data-label="From">${rec.from}</td>
    <td data-label="To">${rec.to}</td>
    <td data-label="Method">${rec.method}</td>
    <td data-label="Customer">${rec.customerName}</td>
    <td data-label="Amount">${rec.amount ?? "N/A"}</td>
    <td data-label="Actions">
      <button onclick="deleteRecord(${rec.id})">Delete</button>
    </td>
  </tr>
`;
