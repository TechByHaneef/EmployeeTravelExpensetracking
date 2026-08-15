// ===============================
// Travel Expense Tracker Script
// ===============================

// --- DOM Elements ---
const addBtn = document.getElementById("addExpense");
const exportBtn = document.getElementById("exportExcel");
const tableBody = document.getElementById("expenseTable");
const totalEl = document.getElementById("total");
const setEmployeeBtn = document.getElementById("setEmployee");
const employeeNameDisplay = document.getElementById("employeeNameDisplay");
const employeeNameInput = document.getElementById("employeeNameInput");

let db;
let employeeName = localStorage.getItem("employeeName") || ""; // ✅ Load employee name from localStorage

// ===============================
// IndexedDB Setup
// ===============================
const request = indexedDB.open("TravelDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("records")) {
    db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  renderRecords();      // ✅ Show existing records
  autoMonthlyReset();   // ✅ Trigger monthly export/reset
};

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

// ===============================
// Employee Name Setup
// ===============================
if (employeeName) {
  employeeNameDisplay.textContent = "Employee: " + employeeName;
  employeeNameInput.style.display = "none";
  setEmployeeBtn.style.display = "none";
}

setEmployeeBtn.addEventListener("click", () => {
  const inputName = employeeNameInput.value;
  if (inputName) {
    employeeName = inputName;
    employeeNameDisplay.textContent = "Employee: " + employeeName;
    localStorage.setItem("employeeName", employeeName); // ✅ Save name persistently

    employeeNameInput.style.display = "none";
    setEmployeeBtn.style.display = "none";
  }
});

// ===============================
// Render Records in Table
// ===============================
function renderRecords() {
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    tableBody.innerHTML = "";
    let total = 0;

    records.forEach((rec) => {
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

    totalEl.textContent = `₹${total.toFixed(2)}`; // ✅ Show total expenses
  };
}

// ===============================
// Add New Record
// ===============================
addBtn.addEventListener("click", () => {
  const today = new Date().toISOString().split("T")[0];
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const method = document.getElementById("method").value;
  const customerName = document.getElementById("customerName").value;
  const amountValue = document.getElementById("amount").value;
  const amount = amountValue ? parseFloat(amountValue) : null;

  if (from && to && method && employeeName && customerName) {
    const record = {
      date: today,
      from,
      to,
      method,
      customerName,
      amount,
      employee: employeeName   // ✅ Store employee name with record
    };

    const tx = db.transaction("records", "readwrite");
    const store = tx.objectStore("records");
    store.add(record);

    tx.oncomplete = () => renderRecords();
  } else {
    alert("Please fill required fields and set employee name first.");
  }
});

// ===============================
// Delete Record
// ===============================
function deleteRecord(id) {
  const tx = db.transaction("records", "readwrite");
  const store = tx.objectStore("records");
  store.delete(id);

  tx.oncomplete = () => renderRecords();
}

// ===============================
// Export Records to Excel (Manual)
// ===============================
exportBtn.addEventListener("click", () => {
  const today = new Date();
  const day = today.getDate();
  let month = today.getMonth(); // 0 = January
  let year = today.getFullYear();

  // If it's the 1st, use previous month
  if (day === 1) {
    month = month - 1;
    if (month < 0) {
      month = 11; // December
      year = year - 1;
    }
  }

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const monthName = monthNames[month];

  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }

    const exportData = records.map(({ id, ...rest }) => ({
      ...rest,
      amount: rest.amount !== null && rest.amount !== undefined ? rest.amount : "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Records");

    const safeEmployee = employeeName || "Unknown";
    const fileName = `${safeEmployee}_${monthName}_${year}_travel_record.xlsx`;

    XLSX.writeFile(workbook, fileName);
    alert(`Exported ${monthName} ${year} records.`);
  };
});

// ===============================
// Auto Monthly Reset (Runs on 1st)
// ===============================
function autoMonthlyReset() {
  const today = new Date();
  const day = today.getDate();
  let month = today.getMonth(); // 0 = January
  let year = today.getFullYear();

  // If it's the 1st, use previous month
  if (day === 1) {
    month = month - 1;
    if (month < 0) {
      month = 11; // December
      year = year - 1;
    }
  }

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const monthName = monthNames[month];

  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = function () {
    const records = request.result;
    if (records.length > 0) {
      const exportData = records.map(({ id, ...rest }) => ({
        ...rest,
        amount: rest.amount ?? "N/A"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Records");

      const safeEmployee = employeeName || "Unknown";
      const fileName = `${safeEmployee}_${monthName}_${year}_travel_record.xlsx`;

      // Save first
      XLSX.writeFile(workbook, fileName);

      // ✅ Only clear records if it's the 1st
      if (day === 1) {
        const clearTx = db.transaction("records", "readwrite");
        clearTx.objectStore("records").clear();
        clearTx.oncomplete = () => {
          renderRecords();
          alert(`Exported ${monthName} ${year} records and cleared.`);
        };
      } else {
        alert(`Exported ${monthName} ${year} records (not cleared).`);
      }
    }
  };
}
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
