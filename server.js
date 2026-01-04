const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path"); // Pastikan ini ada

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PENTING: Gunakan path.join untuk file statis
app.use(express.static(path.join(__dirname, ".")));

const DB_FILE = path.join(__dirname, "database.json");

// Route Utama: Paksa buka login.html saat pertama kali diakses
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// --- API ROUTES (Tetap sama seperti sebelumnya) ---
app.get("/api/seats/:movieId/:showtime", (req, res) => {
  const { movieId, showtime } = req.params;
  const db = JSON.parse(fs.readFileSync(DB_FILE));
  const booked = db.bookings.filter((b) => b.movie_id === movieId && b.showtime === showtime).map((b) => b.seat_id);
  const seats = [];
  for (let i = 1; i <= 20; i++) {
    const id = i.toString();
    seats.push({ seat_id: id, status: booked.includes(id) ? "occupied" : "available" });
  }
  res.json(seats);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = JSON.parse(fs.readFileSync(DB_FILE));
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (user) res.json({ success: true, role: user.role, username: user.username });
  else res.status(401).json({ success: false });
});

// Route lainnya silakan biarkan saja...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on port ${PORT}`));

module.exports = app; // Tambahkan ini khusus untuk Vercel
