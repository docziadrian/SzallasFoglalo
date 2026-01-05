const express = require("express");
const router = express.Router();
const db = require("./db");

// Get all reviews
router.get("/", (req, res) => {
  const sql = "SELECT * FROM user_reviews ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// Update a review
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  const { rating, review_text } = req.body;
  const sql =
    "UPDATE user_reviews SET rating = ?, review_text = ? WHERE id = ?";
  db.query(sql, [rating, review_text, id], (err, result) => {
    if (err) {
      console.error("Error updating review:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "Review updated" });
  });
});

// Delete a review
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM user_reviews WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting review:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "Review deleted" });
  });
});

module.exports = router;
