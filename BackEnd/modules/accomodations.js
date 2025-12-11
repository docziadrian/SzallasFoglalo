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


// A szállás különlegességei endpoint
router.get("/:id/features", (req, res) => {
  const accomodationId = req.params.id;
  const sql = `
    SELECT sf.id, sf.title, sf.shortDescription, sf.icon_key
    FROM special_features sf
    INNER JOIN accomodation_features af ON sf.id = af.featureId
    WHERE af.accomodationId = ?
    ORDER BY sf.title
  `;
  db.query(sql, [accomodationId], (err, results) => {
    if (err) {
      console.error("Error fetching accomodation features:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// Vélemények lekérése szálláshoz
router.get("/:id/reviews", (req, res) => {
  const accomodationId = req.params.id;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const sort = req.query.sort || 'recent'; // 'recent' vagy 'rating'
  
  let orderBy = 'created_at DESC';
  if (sort === 'rating') {
    orderBy = 'rating DESC, created_at DESC';
  }
  
  const sql = `
    SELECT 
      id,
      accomodationId,
      username,
      rating,
      review_text,
      created_at
    FROM user_reviews
    WHERE accomodationId = ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [accomodationId, limit, offset], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        status: 500, 
        message: "Hiba a vélemények lekérésekor",
        error: err 
      });
    }
    res.json({ 
      status: 200, 
      data: results 
    });
  });
});


// Vélemény statisztikák
router.get("/:id/reviews/stats", (req, res) => {
  const accomodationId = req.params.id;
  
  const sql = `
    SELECT 
      COUNT(*) as totalReviews,
      ROUND(AVG(rating), 1) as averageRating,
      rating,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_reviews WHERE accomodationId = ?), 1) as percentage
    FROM user_reviews
    WHERE accomodationId = ?
    GROUP BY rating
    ORDER BY rating DESC
  `;
  
  db.query(sql, [accomodationId, accomodationId], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        status: 500, 
        message: "Hiba a statisztikák lekérésekor",
        error: err 
      });
    }
    
    const totalReviews = results.reduce((sum, r) => sum + r.count, 0);
    const averageRating = results.length > 0 ? results[0].averageRating : 0;
    
    const stats = {
      totalReviews,
      averageRating,
      ratingDistribution: results.map(r => ({
        rating: r.rating,
        count: r.count,
        percentage: r.percentage
      }))
    };
    
    res.json({ 
      status: 200, 
      data: stats 
    });
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
