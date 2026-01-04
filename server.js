const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, ".")));

// Data disimpan di variabel (Memory) agar bisa diproses cepat di Vercel
let db = {
  users: [
    { username: "admin", password: "123", role: "admin" },
    { username: "jeks", password: "123", role: "user" }
  ],
  bookings: []
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, role: user.role, username: user.username });
  else res.status(401).json({ success: false, message: "Username/Password salah!" });
});

app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (db.users.find(u => u.username === username)) return res.json({ error: "User sudah ada!" });
  db.users.push({ username, password, role: "user" });
  res.json({ message: "Berhasil daftar!" });
});

app.get("/api/seats/:movieId/:showtime", (req, res) => {
  const { movieId, showtime } = req.params;
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

app.post("/api/book-seat", (req, res) => {
  const { movieId, seatIds, userName, showtime } = req.body;
  seatIds.forEach(sid => {
    db.bookings.push({ user_name: userName, movie_id: movieId, showtime, seat_id: sid });
  });
  res.json({ success: true });
});

app.get("/api/movies", (req, res) => {
  res.json({ all_bookings: db.bookings });
});

app.post("/api/admin/reset-seats", (req, res) => {
  db.bookings = [];
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
