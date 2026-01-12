const express = require("express");
const router = express.Router();
const db = require("./db");

// Szoba bejegyzés létrehozása szálláshoz kapcsolódva
router.post("/", (req, res) => {
  const { accomodation_id, title, price, max_persons, description, image_url } =
    req.body;
  // A szoba metaadatokat az accomodation_images táblába illesztjük be type='room' értékkel
  const sql =
    "INSERT INTO accomodation_images (accomodation_id, img_name, image_title, type, original, sub_index) VALUES (?, ?, ?, 'room', ?, 0)";
  db.query(sql, [accomodation_id, title, title, image_url], (err, result) => {
    if (err) {
      console.error("Hiba a szoba beillesztésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ insertId: result.insertId, message: "Szoba létrehozva" });
  });
});

// Szobák listázása egy szálláshoz
router.get("/accomodation/:id", (req, res) => {
  const accomodationId = req.params.id;
  const sql =
    "SELECT * FROM accomodation_images WHERE accomodation_id = ? AND type = 'room' ORDER BY sub_index";
  db.query(sql, [accomodationId], (err, results) => {
    if (err) {
      console.error("Hiba a szobák lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

module.exports = router;
