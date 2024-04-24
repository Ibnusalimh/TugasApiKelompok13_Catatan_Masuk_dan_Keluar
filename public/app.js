let accessToken = "";

// Fungsi untuk registrasi
async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.text();
  alert(data);
}

// Fungsi untuk login
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("accessToken", data.accessToken); // Simpan token di localStorage
    accessToken = data.accessToken; // Set token ke variabel global
    document.getElementById("userForm").style.display = "none";
    document.getElementById("expenseForm").style.display = "block";
    fetchExpenses(); // Ambil catatan setelah login
    alert("Login berhasil");
  } else {
    alert("Login gagal: " + data.message);
  }
}

// Fungsi untuk mengambil semua catatan
async function fetchExpenses() {
  const response = await fetch("/expenses", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const expenses = await response.json();
  refreshExpenses(expenses); // Fungsi untuk mengupdate DOM dengan catatan
}

// Fungsi untuk menampilkan catatan
function refreshExpenses(expenses) {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = ""; // Membersihkan list sebelumnya

  if (expenses.length === 0) {
    expensesList.innerHTML = "<p>Tidak ada catatan. Tambahkan catatan!</p>";
  } else {
    expensesList.innerHTML += `
        <div>
          <input type="date" id="startDate" placeholder="Start Date" />
          <input type="date" id="endDate" placeholder="End Date" />
          <button onclick="fetchFilteredExpenses()">Apply Date Filter</button>
        </div>
        
        <div id="dateDisplay"></div>
        `;

    expenses.forEach((expense) => {
      expensesList.innerHTML += `
      <div id="expense-${expense.id}">
          <span>${expense.title} - ${expense.amount} - ${expense.date}</span>
          <button onclick="editExpense(${expense.id})">Edit</button>
          <button onclick="deleteExpense(${expense.id})">Delete</button>
          <div id="editDiv-${expense.id}" style="display:none;">
              <input type="text" id="title-${expense.id}" value="${expense.title}">
              <input type="number" id="amount-${expense.id}" value="${expense.amount}">
              <input type="date" id="date-${expense.id}" value="${expense.date}">
              <button onclick="submitExpenseUpdate(${expense.id})">Save</button>
          </div>
      </div>
  `;
    });
  }
}

// Fungsi untuk mengambil catatan berdasarkan tanggal
async function fetchFilteredExpenses() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) {
    alert("Silakan pilih tanggal mulai dan tanggal akhir.");
    return;
  }

  const response = await fetch(
    `/expenses/filter?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );

  if (response.ok) {
    const expenses = await response.json();
    displayFilteredExpenses(expenses);
  } else {
    alert("Gagal mengambil catatan berdasarkan tanggal.");
  }
}

// Fungsi untuk menampilkan catatan berdasarkan tanggal
function displayFilteredExpenses(expenses) {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = ""; // Membersihkan list sebelumnya

  if (expenses.length === 0) {
    expensesList.innerHTML =
      "<p>Tidak ada catatan untuk rentang tanggal yang dipilih.</p>";
  } else {
    expenses.forEach((expense) => {
      expensesList.innerHTML += `
      <div id="expense-${expense.id}">
      <span>${expense.title} - ${expense.amount} - ${expense.date}</span>
      <button onclick="editExpense(${expense.id})">Edit</button>
      <button onclick="deleteExpense(${expense.id})">Delete</button>
      <div id="editDiv-${expense.id}" style="display:none;">
          <input type="text" id="title-${expense.id}" value="${expense.title}">
          <input type="number" id="amount-${expense.id}" value="${expense.amount}">
          <input type="date" id="date-${expense.id}" value="${expense.date}">
          <button onclick="submitExpenseUpdate(${expense.id})">Save</button>
      </div>
  </div>
          `;
    });
  }
}

// Fungsi untuk mengedit catatan
function editExpense(expenseId) {
  const editDiv = document.getElementById(`editDiv-${expenseId}`);
  editDiv.style.display = "block"; // Tampilkan input yang akan diedit
}

async function submitExpenseUpdate(expenseId) {
  const title = document.getElementById(`title-${expenseId}`).value;
  const amount = document.getElementById(`amount-${expenseId}`).value;
  const date = document.getElementById(`date-${expenseId}`).value;

  const response = await fetch(`/expenses/${expenseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, amount, date }),
  });

  if (response.ok) {
    alert("Catatan berhasil diupdate");
    fetchExpenses(); // refresh list setelah update
  } else {
    alert("Gagal mengupdate catatan");
  }
}

// Fungsi untuk menambah catatan
async function addExpense() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;

  const response = await fetch("/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, description, amount, date }),
  });

  const data = await response.text();
  alert(data);

  if (response.ok) {
    fetchExpenses(); // fetch semua catatan untuk mengupdate daftar
  }
}

// Fungsi untuk menghapus catatan
async function deleteExpense(expenseId) {
  // Fungsi untuk menangani penghapusan catatan
  const response = await fetch(`/expenses/${expenseId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.ok) {
    fetchExpenses(); // refresh list setelah penghapusan
  } else {
    alert("Gagal menghapus catatan!");
  }
}

function logout() {
  localStorage.removeItem("accessToken"); // Hapus token dari localStorage
  accessToken = null; // Bersihkan variabel global
  document.getElementById("userForm").style.display = "block";
  document.getElementById("expenseForm").style.display = "none";
  // Optionally, clear any displayed data that requires login
  document.getElementById("expensesList").innerHTML = "";
  alert("Logout berhasil");
}

document.addEventListener("DOMContentLoaded", function () {
  const storedToken = localStorage.getItem("accessToken");
  if (storedToken) {
    accessToken = storedToken; // Set the global access token
    document.getElementById("userForm").style.display = "none";
    document.getElementById("expenseForm").style.display = "block";
    fetchExpenses(); // Fetch expenses immediately if already logged in
  }
});
