const express = require("express");
const router = express.Router();
const db = require("./db");

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

router.get("/:id/availability", (req, res) => {
  const accomodationId = req.params.id;
  const startDate =
    req.query.startDate || new Date().toISOString().split("T")[0];
  const endDate = req.query.endDate;

  let sql = `
    SELECT 
      a.date,
      a.reserved_rooms,
      acc.maxRooms,
      (acc.maxRooms - a.reserved_rooms) AS available_rooms
    FROM accomodation_availability a
    JOIN accomodations acc ON a.accomodation_id = acc.id
    WHERE a.accomodation_id = ? AND a.date >= ?
  `;

  const params = [accomodationId, startDate];

  if (endDate) {
    sql += " AND a.date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY a.date";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching availability:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

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
