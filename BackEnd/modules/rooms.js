const express = require("express");
const router = express.Router();
const db = require("./db");

// Create a room entry linked to an accomodation
router.post("/", (req, res) => {
  const { accomodation_id, title, price, max_persons, description, image_url } =
    req.body;
  // We'll insert room metadata into accomodation_images table with type='room'
  const sql =
    "INSERT INTO accomodation_images (accomodation_id, img_name, image_title, type, original, sub_index) VALUES (?, ?, ?, 'room', ?, 0)";
  db.query(sql, [accomodation_id, title, title, image_url], (err, result) => {
    if (err) {
      console.error("Error inserting room:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ insertId: result.insertId, message: "Room created" });
  });
});

// List rooms for an accomodation
router.get("/accomodation/:id", (req, res) => {
  const accomodationId = req.params.id;
  const sql =
    "SELECT * FROM accomodation_images WHERE accomodation_id = ? AND type = 'room' ORDER BY sub_index";
  db.query(sql, [accomodationId], (err, results) => {
    if (err) {
      console.error("Error fetching rooms:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

module.exports = router;
