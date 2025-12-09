const express = require("express");
const router = express.Router();
const db = require("./db");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Get all accomodations
router.get("/", (req, res) => {
  const sql = "SELECT * FROM accomodations";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching accomodations:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// GET ACCOMODATIONS IMAGES - Must be BEFORE /:id route
router.get("/:id/images", (req, res) => {
  const accomodationId = req.params.id;
  const sql =
    "SELECT * FROM accomodation_images WHERE accomodation_id = ? ORDER BY sub_index";
  db.query(sql, [accomodationId], (err, results) => {
    if (err) {
      console.error("Error fetching accomodation images:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// GET ONE ACCOMODATION BY ID
router.get("/:id", (req, res) => {
  const accomodationId = req.params.id;
  const sql = "SELECT * FROM accomodations WHERE id = ?";
  db.query(sql, [accomodationId], (err, results) => {
    if (err) {
      console.error("Error fetching accomodation:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Accomodation not found" });
    }
    res.json(results[0]);
  });
});

module.exports = router;
