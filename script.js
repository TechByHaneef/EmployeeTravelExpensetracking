const addBtn = document.getElementById("addExpense");
const tableBody = document.getElementById("expenseTable");
const totalEl = document.getElementById("total");
const setTravelerBtn = document.getElementById("setTraveler");
const travelerNameDisplay = document.getElementById("travelerNameDisplay");
const travelerNameInput = document.getElementById("travelerNameInput");

let records = JSON.parse(localStorage.getItem("travelRecords")) || [];
let travelerName = localStorage.getItem("travelerName") || "";

// Show traveler name if stored and hide input/button
if (travelerName) {
  travelerNameDisplay.textContent = "Traveler: " + travelerName;
  travelerNameInput.style.display = "none";
  setTravelerBtn.style.display = "none";
}

// Render records in the table
function renderRecords() {
  tableBody.innerHTML = "";
  let total = 0;
  records.forEach((rec, index) => {
    total += rec.amount;
    const row = `
      <tr>
        <td>${rec.date}</td>
        <td>${rec.from}</td>
        <td>${rec.to}</td>
        <td>${rec.method}</td>
        <td>${rec.amount}</td>
        <td>
          <button onclick="deleteRecord(${index})">Delete</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
  totalEl.textContent = total;
  localStorage.setItem("travelRecords", JSON.stringify(records));
}

// Delete a record
function deleteRecord(index) {
  records.splice(index, 1);
  renderRecords();
}

// Add a new record
addBtn.addEventListener("click", () => {
  const today = new Date().toISOString().split("T")[0];
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const method = document.getElementById("method").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if (from && to && method && amount && travelerName) {
    const record = {
      id: Date.now(), // unique ID
      date: today,
      from,
      to,
      method,
      amount,
      traveler: travelerName
    };

    records.push(record);
    renderRecords();
  } else {
    alert("Please fill all fields and set traveler name first.");
  }
});

// Set traveler name and hide input/button
setTravelerBtn.addEventListener("click", () => {
  const inputName = travelerNameInput.value;
  if (inputName) {
    travelerName = inputName;
    travelerNameDisplay.textContent = "Traveler: " + travelerName;
    localStorage.setItem("travelerName", travelerName);

    travelerNameInput.style.display = "none";
    setTravelerBtn.style.display = "none";
  }
});

// Initial render
renderRecords();
