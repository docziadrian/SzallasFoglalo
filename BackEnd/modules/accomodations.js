const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", (req, res) => {
  // If ?all=true is provided, return all accomodations (admin usage). Otherwise only active ones.
  const all = req.query.all === "true";
  const sql = all
    ? "SELECT * FROM accomodations"
    : "SELECT * FROM accomodations WHERE (active = 1 OR is_active = 1)";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching accomodations:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

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

router.get("/:id/reviews", (req, res) => {
  const accomodationId = req.params.id;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const sort = req.query.sort || "recent";

  let orderBy = "created_at DESC";
  if (sort === "rating") {
    orderBy = "rating DESC, created_at DESC";
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
        error: err,
      });
    }
    res.json({
      status: 200,
      data: results,
    });
  });
});

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
        error: err,
      });
    }

    const totalReviews = results.reduce((sum, r) => sum + r.count, 0);
    const averageRating = results.length > 0 ? results[0].averageRating : 0;

    const stats = {
      totalReviews,
      averageRating,
      ratingDistribution: results.map((r) => ({
        rating: r.rating,
        count: r.count,
        percentage: r.percentage,
      })),
    };

    res.json({
      status: 200,
      data: stats,
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

  const getAccommodationSql =
    "SELECT maxRooms, reservedRooms FROM accomodations WHERE id = ?";

  db.query(getAccommodationSql, [accomodationId], (err, accResults) => {
    if (err) {
      console.error("Error fetching accommodation:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (accResults.length === 0) {
      return res.status(404).json({ error: "Accommodation not found" });
    }

    const maxRooms = accResults[0].maxRooms;

    const start = new Date(startDate);
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    const bookingsSql = `
      SELECT startDate, endDate 
      FROM bookings 
      WHERE accommodationId = ? 
        AND status != 'cancelled'
        AND startDate < ?
        AND endDate > ?
    `;

    const bookingEndDate = new Date(end);
    bookingEndDate.setDate(bookingEndDate.getDate() + 1);

    db.query(
      bookingsSql,
      [accomodationId, bookingEndDate.toISOString().split("T")[0], startDate],
      (err, bookings) => {
        if (err) {
          console.error("Error fetching bookings:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        const availability = dates.map((date) => {
          const reservedRooms = bookings.filter((booking) => {
            const bookingStart = new Date(booking.startDate)
              .toISOString()
              .split("T")[0];
            const bookingEnd = new Date(booking.endDate)
              .toISOString()
              .split("T")[0];
            return date >= bookingStart && date < bookingEnd;
          }).length;

          return {
            date: date,
            reserved_rooms: reservedRooms,
            maxRooms: maxRooms,
            available_rooms: maxRooms - reservedRooms,
          };
        });

        res.json(availability);
      }
    );
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

router.post("/", (req, res) => {
  const {
    name,
    city,
    address,
    priceforone,
    max_guests,
    description,
    cover_image,
    avgrating,
  } = req.body;

  // Map frontend 'address' to 'street' and create 'full_address'
  // 'max_guests' is removed from INSERT as it doesn't exist in the DB schema provided
  const street = address;
  const full_address = `${city}, ${address}`;
  const title = name; // Use name as title

  const sql = `INSERT INTO accomodations (name, city, street, full_address, priceforone, description, cover_image, avgrating, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      name,
      city,
      street,
      full_address,
      priceforone,
      description,
      cover_image,
      avgrating,
      title,
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting accomodation:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json({ insertId: result.insertId, message: "Accomodation created" });
    }
  );
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM accomodations WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting accomodation:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "Accomodation deleted" });
  });
});

// Update accomodation fields
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  // allow 'active' so admin can enable/disable accomodations via standard PATCH
  const allowed = [
    "name",
    "city",
    "street",
    "full_address",
    "priceforone",
    "description",
    "cover_image",
    "title",
    "active",
  ];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates[k] =
        k === "active" && typeof req.body[k] === "boolean"
          ? req.body[k]
            ? 1
            : 0
          : req.body[k];
    }
  }
  const keys = Object.keys(updates);
  if (keys.length === 0)
    return res.status(400).json({ error: "No editable fields provided" });

  const sql = `UPDATE accomodations SET ${keys
    .map((k) => k + " = ?")
    .join(", ")} WHERE id = ?`;
  const params = keys.map((k) => updates[k]).concat([id]);
  db.query(sql, params, (err, result) => {
    if (err) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(400).json({
          error:
            "One of the supplied fields doesn't exist on accomodations table",
          details: err.message,
        });
      }
      console.error("Error updating accomodation:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "Accomodation updated" });
  });
});

// Toggle active/inactive for accomodation (tries 'active' then 'is_active')
router.patch("/:id/toggle-active", (req, res) => {
  const id = req.params.id;
  const value = req.body.active; // expected boolean
  if (typeof value !== "boolean")
    return res.status(400).json({ error: "Provide boolean `active` in body" });

  const tryUpdate = (col, cb) => {
    const sql = `UPDATE accomodations SET ${col} = ? WHERE id = ?`;
    db.query(sql, [value ? 1 : 0, id], (err, result) => {
      if (err) return cb(err);
      return cb(null, result);
    });
  };

  tryUpdate("active", (err, r) => {
    if (!err)
      return res.json({
        message: "Accomodation active updated",
        column: "active",
      });
    tryUpdate("is_active", (err2, r2) => {
      if (!err2)
        return res.json({
          message: "Accomodation active updated",
          column: "is_active",
        });
      console.error("Error toggling active on accomodations:", err, err2);
      res.status(400).json({
        error:
          "No 'active' column found on accomodations table or update failed",
      });
    });
  });
});

module.exports = router;
