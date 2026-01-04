const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, ".")));

const DB_FILE = path.join(__dirname, "database.json");

// Fungsi baca/tulis database yang aman
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// API Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, role: user.role, username: user.username });
  else res.status(401).json({ success: false, message: "Username atau Password salah!" });
});

// API Register
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  if (db.users.find(u => u.username === username)) return res.json({ error: "Username sudah ada!" });
  db.users.push({ username, password, role: "user" });
  writeDB(db);
  res.json({ message: "Pendaftaran Berhasil! Silakan Login." });
});

// API Ambil Kursi
app.get("/api/seats/:movieId/:showtime", (req, res) => {
  const { movieId, showtime } = req.params;
  const db = readDB();
  const booked = db.bookings
    .filter(b => b.movie_id === movieId && b.showtime === showtime)
    .map(b => b.seat_id);
  
  const seats = [];
  for (let i = 1; i <= 20; i++) {
    const id = i.toString();
    seats.push({ seat_id: id, status: booked.includes(id) ? "occupied" : "available" });
  }
  res.json(seats);
});

// API Booking Kursi
app.post("/api/book-seat", (req, res) => {
  const { movieId, seatIds, userName, showtime } = req.body;
  const db = readDB();
  seatIds.forEach(sid => {
    db.bookings.push({ user_name: userName, movie_id: movieId, showtime, seat_id: sid });
  });
  writeDB(db);
  res.json({ success: true });
});

// API Khusus Admin (Daftar Semua Pesanan)
app.get("/api/movies", (req, res) => {
  const db = readDB();
  res.json({ all_bookings: db.bookings });
});

// API Reset Data
app.post("/api/admin/reset-seats", (req, res) => {
  const db = readDB();
  db.bookings = [];
  writeDB(db);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
