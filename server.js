const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

const DB_FILE = path.join(__dirname, "database.json");

// Helper untuk membaca DB
const readDB = () => {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
};

// Helper untuk menulis DB
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// 1. Ambil Kursi (Berdasarkan movie_id & showtime)
app.get("/api/seats/:movieId/:showtime", (req, res) => {
  const { movieId, showtime } = req.params;
  const db = readDB();

  // Filter booking yang sudah ada untuk jam tersebut
  const bookedInSession = db.bookings.filter((b) => b.movie_id === movieId && b.showtime === showtime).map((b) => b.seat_id);

  const seats = [];
  for (let i = 1; i <= 20; i++) {
    const id = i.toString();
    // Cek apakah di database pusat (array seats) sudah occupied ATAU di booking session sudah ada
    const isOccupiedInDB = db.seats.some((s) => s.movie_id === movieId && s.seat_id === id && s.status === "occupied");
    const isBookedNow = bookedInSession.includes(id);

    seats.push({
      seat_id: id,
      status: isOccupiedInDB || isBookedNow ? "occupied" : "available",
    });
  }
  res.json(seats);
});

// 2. Pesan Kursi
app.post("/api/book-seat", (req, res) => {
  const { movieId, seatIds, userName, showtime } = req.body;
  const db = readDB();

  seatIds.forEach((id) => {
    // Tambah ke riwayat booking
    db.bookings.push({
      user_name: userName,
      movie_id: movieId,
      showtime: showtime,
      seat_id: id,
    });

    // Update status di array seats agar tetap occupied
    const seatIndex = db.seats.findIndex((s) => s.movie_id === movieId && s.seat_id === id);
    if (seatIndex > -1) {
      db.seats[seatIndex].status = "occupied";
    } else {
      db.seats.push({ movie_id: movieId, seat_id: id, status: "occupied" });
    }
  });

  writeDB(db);
  res.json({ success: true });
});

// 3. Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, role: user.role, username: user.username });
  } else {
    res.status(401).json({ success: false, message: "Login Gagal" });
  }
});

// 4. Register
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  if (db.users.find((u) => u.username === username)) {
    return res.json({ error: "Username sudah ada" });
  }
  db.users.push({ username, password, role: "user" });
  writeDB(db);
  res.json({ message: "Ok" });
});

// 5. Ambil Semua Data untuk Admin
app.get("/api/movies", (req, res) => {
  const db = readDB();
  res.json({ all_bookings: db.bookings });
});

// 6. Reset Data (Oleh Admin)
app.post("/api/admin/reset-seats", (req, res) => {
  const db = readDB();
  db.bookings = [];
  // Reset semua status kursi menjadi available
  db.seats.forEach((s) => (s.status = "available"));
  writeDB(db);
  res.json({ success: true });
});

// PORT DINAMIS UNTUK HOSTING
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
