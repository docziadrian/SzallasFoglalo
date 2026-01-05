const express = require("express");
const router = express.Router();
const db = require("./db");

router.post("/", (req, res) => {
  const { accomodation_id, image_path, sub_index } = req.body;
  // The table schema has 'original' column for the image URL, not 'image_path'
  const sql =
    "INSERT INTO accomodation_images (accomodation_id, original, sub_index) VALUES (?, ?, ?)";
  db.query(sql, [accomodation_id, image_path, sub_index], (err, result) => {
    if (err) {
      console.error("Error inserting image:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "Image inserted" });
  });
});

module.exports = router;
