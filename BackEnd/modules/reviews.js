const express = require("express");
const router = express.Router();
const db = require("./db");

// Összes vélemény lekérése
router.get("/", (req, res) => {
  const sql = "SELECT * FROM user_reviews ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Hiba a vélemények lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

// Vélemény frissítése
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  const { rating, review_text } = req.body;
  const sql =
    "UPDATE user_reviews SET rating = ?, review_text = ? WHERE id = ?";
  db.query(sql, [rating, review_text, id], (err, result) => {
    if (err) {
      console.error("Hiba a vélemény frissítésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Vélemény frissítve" });
  });
});

// Vélemény törlése
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM user_reviews WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Hiba a vélemény törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Vélemény törölve" });
  });
});

module.exports = router;
