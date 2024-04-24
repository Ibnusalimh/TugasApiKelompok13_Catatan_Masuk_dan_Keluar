const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static("public"));

const db = new sqlite3.Database("./finance.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the finance database.");
});

// Middleware untuk autentikasi
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// Registrasi
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  // Cek username dan password terisi atau tidak
  if (!username || !password) {
    return res.status(400).send("Username dan password harus diisi");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (err) {
        if (err) {
          return res.status(400).send("Username already exists");
        }
        res.status(201).send("User created");
      }
    );
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (user && (await bcrypt.compare(password, user.password))) {
        console.log(
          "Token Secret Loaded:",
          process.env.ACCESS_TOKEN_SECRET ? "Yes" : "No"
        );
        const accessToken = jwt.sign(
          { username: user.username, id: user.id },
          process.env.ACCESS_TOKEN_SECRET
        );
        res.json({ accessToken });
      } else {
        res.send("Username or password incorrect");
      }
    }
  );
});

// Tambah catatan
app.post("/expenses", authenticateToken, (req, res) => {
  const { title, description, amount, date } = req.body;
  db.run(
    `INSERT INTO expenses (user_id, title, description, amount, date) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title, description, amount, date],
    function (err) {
      if (err) {
        return res.status(400).send("Error adding expense");
      }
      res.status(201).send("Expense added");
    }
  );
});

// Lihat catatan
app.get("/expenses", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM expenses WHERE user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(400).send("Error fetching expenses");
      }
      res.json(rows);
    }
  );
});

// Lihat catatan berdasarkan ID
app.get("/expenses/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT * FROM expenses WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(400).send("Error fetching expense");
      }
      if (row) {
        res.json(row);
      } else {
        res.status(404).send("Expense not found");
      }
    }
  );
});

// Update catatan
app.put("/expenses/:id", authenticateToken, (req, res) => {
  const { title, description, amount, date } = req.body;
  const { id } = req.params; // Memastikan mengambil parameter 'id' dari URL

  db.run(
    `UPDATE expenses SET title = ?, description = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?`,
    [title, description, amount, date, id, req.user.id],
    function (err) {
      if (err) {
        return res.status(400).send("Error updating expense");
      }
      if (this.changes > 0) {
        res.send("Expense updated");
      } else {
        res.status(404).send("Expense not found");
      }
    }
  );
});

// Hapus catatan
app.delete("/expenses/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM expenses WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function (err) {
      if (err) {
        return res.status(400).send("Error deleting expense");
      }
      if (this.changes > 0) {
        res.send("Expense deleted");
      } else {
        res.status(404).send("Expense not found");
      }
    }
  );
});

function filterDataByDate(startDate, endDate) {
  db.all(
    `SELECT * FROM expenses WHERE user_id = ? AND date(date) BETWEEN date(?) AND date(?)`,
    [req.user.id, startDate, endDate],
    (err, rows) => {
      if (err) {
        return res.status(400).send("Error fetching expenses");
      }
      if (rows.length === 0) {
        return res
          .status(404)
          .send("Expenses not found for the selected date range.");
      }
      res.json(rows);
    }
  );
}

// Filter berdasarkan tanggal
app.get("/expenses", authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;

  // Pastikan tanggal mulai dan tanggal akhir diisi
  if (!startDate || !endDate) {
    return res
      .status(400)
      .send("Both start date and end date are required for filtering.");
  }

  const filteredData = filterDataByDate(startDate, endDate);
  res.json(filteredData);
});
