let accessToken = "";

function showToast(message, type = "info") {
  const toastElement = document.getElementById("toast");
  const toastBody = document.getElementById("toastBody");

  toastBody.innerText = message;
  toastElement.classList.remove(
    "bg-info",
    "bg-success",
    "bg-warning",
    "bg-danger"
  );

  switch (type) {
    case "success":
      toastElement.classList.add("bg-success");
      break;
    case "warning":
      toastElement.classList.add("bg-warning");
      break;
    case "danger":
      toastElement.classList.add("bg-danger");
      break;
    default:
      toastElement.classList.add("bg-info");
  }

  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000,
  });
  toast.show();
}

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
  showToast(data);
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
    showToast("Login berhasil", "success");
  } else {
    showToast("Login gagal: " + data.message, "danger");
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
    expensesList.innerHTML =
      "<p class='alert alert-info text-center'>Tidak ada catatan. Tambahkan catatan!</p>";
  } else {
    expensesList.innerHTML += `
        <div class="d-flex flex-column flex-md-row gap-md-3">
          <div>
            <label>Start date</label>
            <input type="date" id="startDate" placeholder="Start Date" class="form-control" />
          </div>
          <div>
            <label>End date</label>
            <input type="date" id="endDate"   placeholder="End Date" class="form-control" />
          </div>
          <button onclick="fetchFilteredExpenses()" class="btn btn-primary d-block w-100">Apply Date Filter</button>
        </div>
        
        <div id="dateDisplay"></div>
        `;

    expenses.forEach((expense) => {
      expensesList.innerHTML += `
      <div id="expense-${expense.id}" class="border rounded p-2 mb-2">
          <p><span class="fw-bold">Title</span>: ${expense.title}</p>
          <p><span class="fw-bold">Amount</span>: ${expense.amount}</p>
          <p><span class="fw-bold">Date</span>: ${expense.date}</p>
          <p><span class="fw-bold">Description</span>: ${expense.description}</p>
          <button onclick="editExpense(${expense.id})" class="btn btn-outline-primary">Edit</button>
          <button onclick="deleteExpense(${expense.id})" class="btn btn-outline-danger">Delete</button>
          <div id="editDiv-${expense.id}" style="display:none;">
              <input type="text" id="title-${expense.id}" value="${expense.title}" class="form-control">
              <input type="number" id="amount-${expense.id}" value="${expense.amount}" class="form-control">
              <input type="date" id="date-${expense.id}" value="${expense.date}" class="form-control">
              <textarea id="description-${expense.id}" placeholder="Masukkan deskripsi" class="form-control">${expense.description}</textarea>
              <button onclick="submitExpenseUpdate(${expense.id})" class="btn btn-warning">Save</button>
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
    showToast("Silakan pilih tanggal mulai dan tanggal akhir.", "warning");
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
    showToast("Gagal mengambil catatan berdasarkan tanggal.", "danger");
  }
}

// Fungsi untuk menampilkan catatan berdasarkan tanggal
function displayFilteredExpenses(expenses) {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = ""; // Membersihkan list sebelumnya

  if (expenses.length === 0) {
    expensesList.innerHTML =
      "<p class='alert alert-info text-center'>Tidak ada catatan untuk rentang tanggal yang dipilih.</p>";
  } else {
    expenses.forEach((expense) => {
      expensesList.innerHTML += `
      <div id="expense-${expense.id}" class="border rounded p-2 mb-2">
          <p><span class="fw-bold">Title</span>: ${expense.title}</p>
          <p><span class="fw-bold">Amount</span>: ${expense.amount}</p>
          <p><span class="fw-bold">Date</span>: ${expense.date}</p>
          <p><span class="fw-bold">Description</span>: ${expense.description}</p>
          <button onclick="editExpense(${expense.id})" class="btn btn-outline-primary">Edit</button>
          <button onclick="deleteExpense(${expense.id})" class="btn btn-outline-danger">Delete</button>
          <div id="editDiv-${expense.id}" style="display:none;">
              <input type="text" id="title-${expense.id}" value="${expense.title}" class="form-control">
              <input type="number" id="amount-${expense.id}" value="${expense.amount}" class="form-control">
              <input type="date" id="date-${expense.id}" value="${expense.date}" class="form-control">
              <textarea id="description-${expense.id}" placeholder="Masukkan deskripsi" class="form-control">${expense.description}</textarea>
              <button onclick="submitExpenseUpdate(${expense.id})" class="btn btn-warning">Save</button>
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
  const description = document.getElementById(`description-${expenseId}`).value;

  const response = await fetch(`/expenses/${expenseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, amount, date, description }),
  });

  if (response.ok) {
    showToast("Catatan berhasil diupdate", "success");
    fetchExpenses(); // refresh list setelah update
  } else {
    showToast("Gagal mengupdate catatan", "danger");
  }
}

// Fungsi untuk menambah catatan
async function addExpense() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;

  // Menampilkan notifikasi jika ada field kosong
  if (title === "" || description === "" || amount === "" || date === "") {
    // menampilkan toast
    const toast = new bootstrap.Toast(document.getElementById("toast"), {
      autohide: false,
    });
    document.getElementById(
      "toastBody"
    ).innerHTML = `Periksa bahwa semua kolom input harus <strong>terisi dan format sesuai</strong> sebelum melanjutkan`;
    toast.show();
    return;
  }

  const response = await fetch("/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, description, amount, date }),
  });

  const data = await response.text();
  showToast(data);

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
    showToast("Gagal menghapus catatan!", "danger");
  }
}

function logout() {
  localStorage.removeItem("accessToken"); // Hapus token dari localStorage
  accessToken = null; // Bersihkan variabel global
  document.getElementById("userForm").style.display = "block";
  document.getElementById("expenseForm").style.display = "none";
  // Opsional, hapus semua data yang memerlukan login
  document.getElementById("expensesList").innerHTML = "";
  showToast("Logout berhasil", "info");
}

document.addEventListener("DOMContentLoaded", function () {
  const storedToken = localStorage.getItem("accessToken");
  if (storedToken) {
    accessToken = storedToken; // atur global token storage
    document.getElementById("userForm").style.display = "none";
    document.getElementById("expenseForm").style.display = "block";
    fetchExpenses(); // ambil data ketika berhasil login
  }
});
