const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", (req, res) => {

  const all = req.query.all === "true";
  if (all) {
    return db.query("SELECT * FROM accomodations", (err, results) => {
      if (err) {
        console.error("Hiba szállások lekérésekor:", err);
        return res.status(500).json({ error: "Belső szerver hiba" });
      }
      res.json(results);
    });
  }

  const tryQuery = (sql, fallback) => {
    db.query(sql, (err, results) => {
      if (!err) return res.json(results);
      if (err && err.code === "ER_BAD_FIELD_ERROR" && typeof fallback === "function") {
        return fallback();
      }
      console.error("Hiba szállások lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    });
  };

  tryQuery(
    "SELECT * FROM accomodations WHERE active = 1",
    () => tryQuery("SELECT * FROM accomodations WHERE is_active = 1")
  );
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
      console.error("Hiba szállás funkcióinak lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
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
      console.error("Hiba a vélemények lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
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
      console.error("Hiba a statisztikák lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
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
      console.error("Hiba a szállás képeinek lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
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
      console.error("Hiba a szállás lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (accResults.length === 0) {
      return res.status(404).json({ error: "Szállás nem található" });
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
          console.error("Hiba a foglalások lekérésekor:", err);
          return res.status(500).json({ error: "Belső szerver hiba" });
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
      console.error("Hiba a szállás lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Szállás nem található" });
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


  const street = address;
  const full_address = `${city}, ${address}`;
  const title = name; 

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
        console.error("Hiba a szállás létrehozásakor:", err);
        return res.status(500).json({ error: "Belső szerver hiba" });
      }

      const id = result.insertId;
      const trySetActive = (col, cb) => {
        db.query(
          `UPDATE accomodations SET ${col} = 1 WHERE id = ?`,
          [id],
          (e) => cb(e)
        );
      };

      trySetActive("active", (e1) => {
        if (!e1) return res.json({ insertId: id, message: "Szállás létrehozva" });
        trySetActive("is_active", (e2) => {
          res.json({ insertId: id, message: "Szállás létrehozva" });
        });
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM accomodations WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Hiba a szállás törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Szállás törölve" });
  });
});

router.patch("/:id", (req, res) => {
  const id = req.params.id;
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
      console.error("Hiba a szállás frissítésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Szállás frissítve" });
  });
});


router.patch("/:id/toggle-active", (req, res) => {
  const id = req.params.id;
  const raw = req.body.active;

  let value = raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1") value = true;
    if (s === "false" || s === "0") value = false;
  }
  if (typeof raw === "number") {
    if (raw === 1) value = true;
    if (raw === 0) value = false;
  }

  if (typeof value !== "boolean")
    return res.status(400).json({ error: "Érvénytelen active érték" });

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
        message: "Szállás aktív státusza frissítve",
        column: "active",
      });
    tryUpdate("is_active", (err2, r2) => {
      if (!err2)
        return res.json({
          message: "Szállás aktív státusza frissítve",
          column: "is_active",
        });
      console.error("Hiba a szállás aktív státuszának frissítésekor:", err, err2);
      res.status(400).json({
        error:
          "Nem található 'active' oszlop a szállás táblában vagy a frissítés sikertelen",
      });
    });
  });
});

module.exports = router;
