const express = require("express");
const router = express.Router();
const db = require("./db");

router.post("/", (req, res) => {
  const { accomodation_id, image_path, sub_index } = req.body;
 
  const sql =
    "INSERT INTO accomodation_images (accomodation_id, original, sub_index) VALUES (?, ?, ?)";
  db.query(sql, [accomodation_id, image_path, sub_index], (err, result) => {
    if (err) {
      console.error("Hiba képek beszurásakor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Kép beszurva" });
  });
});

module.exports = router;
