const express = require("express");
const router = express.Router();
const db = require("./db");

// Összes foglalás lekérése
const adminAuth = require("../middlewares/adminAuth");

// Get all bookings with joined user and accomodation info for admin
router.get("/", adminAuth, (req, res) => {
  const sql = `
    SELECT b.id, b.userId, b.accommodationId, b.startDate, b.endDate, b.persons, b.totalPrice, b.status,
           u.name as userName, a.name as accomodationName
    FROM bookings b
    LEFT JOIN users u ON b.userId = u.id
    LEFT JOIN accomodations a ON b.accommodationId = a.id
    ORDER BY b.createdAt DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching bookings:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// Foglalások lekérése szállás ID alapján
router.get("/accommodation/:id", (req, res) => {
  const accommodationId = req.params.id;
  const sql = "SELECT * FROM bookings WHERE accommodationId = ?";

  db.query(sql, [accommodationId], (err, results) => {
    if (err) {
      console.error("Error fetching bookings for accommodation:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

// Foglalások lekérése user ID alapján
router.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM bookings WHERE userId = ?";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user bookings:", err);
      return res.status(500).json({ error: "Internal server error" });
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
      console.error("Error fetching booking:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(results[0]);
  });
});

// Új foglalás létrehozása
router.post("/", (req, res) => {
  const {
    userId,
    accommodationId,
    startDate,
    endDate,
    persons,
    totalPrice,
    status,
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Transaction error" });
    }

    // First, get the accommodation's max rooms
    const getAccommodationSql =
      "SELECT maxRooms FROM accomodations WHERE id = ?";

    db.query(getAccommodationSql, [accommodationId], (err, accResults) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: "Error fetching accommodation" });
        });
      }

      if (accResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "Accommodation not found" });
        });
      }

      const maxRooms = accResults[0].maxRooms;

      // Check availability for the date range by counting overlapping bookings
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

      db.query(
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
            return db.rollback(() => {
              res.status(500).json({ error: "Error checking availability" });
            });
          }

          const bookedRooms = availabilityResults[0].bookedRooms;
          const availableRooms = maxRooms - bookedRooms;

          if (availableRooms <= 0) {
            return db.rollback(() => {
              res.status(400).json({
                error: "Nincs szabad szoba a kiválasztott időszakban!",
                availableRooms: 0,
                maxRooms: maxRooms,
              });
            });
          }

          // Create the booking - the trigger will automatically update reservedRooms
          const bookingSql = `
            INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          db.query(
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
                return db.rollback(() => {
                  console.error("Error creating booking:", err);
                  res.status(500).json({ error: "Error creating booking" });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: "Transaction commit error" });
                  });
                }

                res.status(201).json({
                  id: result.insertId,
                  message: "Booking created successfully",
                  availableRooms: availableRooms - 1,
                });
              });
            }
          );
        }
      );
    });
  });
});

// Foglalás frissítése
router.patch("/:id", (req, res) => {
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
    return res.status(400).json({ error: "No valid fields to update" });
  }

  values.push(bookingId);
  const sql = `UPDATE bookings SET ${updateFields.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating booking:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking updated successfully" });
  });
});

// Foglalás törlése
router.delete("/:id", (req, res) => {
  const bookingId = req.params.id;
  const sql = "DELETE FROM bookings WHERE id = ?";

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error("Error deleting booking:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  });
});

module.exports = router;
