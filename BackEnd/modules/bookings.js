const express = require("express");
const router = express.Router();
const db = require("./db");

// Összes foglalás lekérése
const adminAuth = require("../middlewares/adminAuth");
const requireAuth = require("../middlewares/requireAuth");

router.get("/", adminAuth, (req, res) => {
  const userId = req.query.userId;
  
  let sql = `
    SELECT b.id, b.userId, b.accommodationId, b.startDate, b.endDate, b.persons, b.totalPrice, b.status,
           u.name as userName, a.name as accomodationName
    FROM bookings b
    LEFT JOIN users u ON b.userId = u.id
    LEFT JOIN accomodations a ON b.accommodationId = a.id
  `;
  
  const params = [];
  
  if (userId) {
    sql += " WHERE b.userId = ?";
    params.push(userId);
  }
  
  sql += " ORDER BY b.createdAt DESC";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Hiba a foglalások lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

router.get("/my", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const sql = `
    SELECT b.id, b.userId, b.accommodationId, b.startDate, b.endDate, b.persons, b.totalPrice, b.status,
           a.name as accomodationName
    FROM bookings b
    LEFT JOIN accomodations a ON b.accommodationId = a.id
    WHERE b.userId = ?
    ORDER BY b.createdAt DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Hiba a foglalások lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

router.delete("/my/:id", requireAuth, (req, res) => {
  const bookingId = req.params.id;
  const userId = req.session.user.id;

  const sql = "DELETE FROM bookings WHERE id = ? AND userId = ?";
  db.query(sql, [bookingId, userId], (err, result) => {
    if (err) {
      console.error("Hiba a foglalás törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Foglalás nem található" });
    }

    res.json({ message: "Foglalás sikeresen törölve" });
  });
});

// Foglalások lekérése szállás ID alapján
router.get("/accommodation/:id", (req, res) => {
  const accommodationId = req.params.id;
  const sql = "SELECT * FROM bookings WHERE accommodationId = ?";

  db.query(sql, [accommodationId], (err, results) => {
    if (err) {
      console.error("Hiba a szállás foglalásainak lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

// Foglalások lekérése user ID alapján
router.get("/user/:userId", adminAuth, (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM bookings WHERE userId = ?";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Hiba a felhasználó foglalásainak lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

// Egy foglalás lekérése ID alapján
router.get("/:id", (req, res) => {
  const bookingId = req.params.id;
  const sql = "SELECT * FROM bookings WHERE id = ?";

  db.query(sql, [bookingId], (err, results) => {
    if (err) {
      console.error("Hiba a foglalás lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Foglalás nem található" });
    }

    res.json(results[0]);
  });
});

// Új foglalás létrehozása
router.post("/", adminAuth, (req, res) => {
  const {
    userId,
    accommodationId,
    startDate,
    endDate,
    persons,
    totalPrice,
    status,
  } = req.body;

  db.getConnection((err, connection) => {
    if (err || !connection) {
      console.error("Hiba a DB kapcsolat lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    const rollbackAndRelease = (cb) => {
      connection.rollback(() => {
        connection.release();
        if (typeof cb === "function") cb();
      });
    };

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: "Tranzakciós hiba" });
      }

      const getAccommodationSql =
        "SELECT maxRooms FROM accomodations WHERE id = ?";

      connection.query(
        getAccommodationSql,
        [accommodationId],
        (err, accResults) => {
          if (err) {
            return rollbackAndRelease(() => {
              res.status(500).json({ error: "Hiba a szállás lekérésekor" });
            });
          }

          if (!accResults || accResults.length === 0) {
            return rollbackAndRelease(() => {
              res.status(404).json({ error: "Szállás nem található" });
            });
          }

          const maxRooms = accResults[0].maxRooms;

          const checkAvailabilitySql = `
            SELECT COUNT(*) as bookedRooms
            FROM bookings
            WHERE accommodationId = ? 
              AND status != 'cancelled'
              AND (
                (startDate <= ? AND endDate > ?)
                OR (startDate < ? AND endDate >= ?)
                OR (startDate >= ? AND endDate <= ?)
              )
          `;

          connection.query(
            checkAvailabilitySql,
            [
              accommodationId,
              startDate,
              startDate,
              endDate,
              endDate,
              startDate,
              endDate,
            ],
            (err, availabilityResults) => {
              if (err) {
                return rollbackAndRelease(() => {
                  res
                    .status(500)
                    .json({ error: "Hiba a rendelkezésre állás ellenőrzésekor" });
                });
              }

              const bookedRooms = availabilityResults[0].bookedRooms;
              const availableRooms = maxRooms - bookedRooms;

              if (availableRooms <= 0) {
                return rollbackAndRelease(() => {
                  res.status(400).json({
                    error: "Nincs szabad szoba a kiválasztott időszakban!",
                    availableRooms: 0,
                    maxRooms: maxRooms,
                  });
                });
              }

              const bookingSql = `
                INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status, createdAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
              `;

              connection.query(
                bookingSql,
                [
                  userId,
                  accommodationId,
                  startDate,
                  endDate,
                  persons,
                  totalPrice,
                  status || "confirmed",
                ],
                (err, result) => {
                  if (err) {
                    return rollbackAndRelease(() => {
                      console.error("Hiba a foglalás létrehozásakor:", err);
                      res
                        .status(500)
                        .json({ error: "Hiba a foglalás létrehozásakor" });
                    });
                  }

                  connection.commit((err) => {
                    if (err) {
                      return rollbackAndRelease(() => {
                        res
                          .status(500)
                          .json({ error: "Tranzakció véglegesítési hiba" });
                      });
                    }

                    connection.release();
                    res.status(201).json({
                      id: result.insertId,
                      message: "Foglalás sikeresen létrehozva",
                      availableRooms: availableRooms - 1,
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Foglalás frissítése
router.patch("/:id", adminAuth, (req, res) => {
  const bookingId = req.params.id;
  const updates = req.body;

  const allowedFields = [
    "startDate",
    "endDate",
    "persons",
    "totalPrice",
    "status",
  ];
  const updateFields = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: "Nincs érvényes mező frissítésre" });
  }

  values.push(bookingId);
  const sql = `UPDATE bookings SET ${updateFields.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Hiba a foglalás frissítésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Foglalás nem található" });
    }

    res.json({ message: "Foglalás sikeresen frissítve" });
  });
});

// Foglalás törlése
router.delete("/:id", adminAuth, (req, res) => {
  const bookingId = req.params.id;
  const sql = "DELETE FROM bookings WHERE id = ?";

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error("Hiba a foglalás törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Foglalás nem található" });
    }

    res.json({ message: "Foglalás sikeresen törölve" });
  });
});

module.exports = router;
