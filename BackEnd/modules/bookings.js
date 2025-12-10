const express = require("express");
const router = express.Router();
const db = require("./db");

// Összes foglalás lekérése
router.get("/", (req, res) => {
  const sql = "SELECT * FROM bookings";
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

    const checkAvailabilitySql = `
      SELECT date, (acc.maxRooms - a.reserved_rooms) AS available_rooms
      FROM accomodation_availability a
      JOIN accomodations acc ON a.accomodation_id = acc.id
      WHERE a.accomodation_id = ? AND a.date >= ? AND a.date < ?
    `;

    db.query(
      checkAvailabilitySql,
      [accommodationId, startDate, endDate],
      (err, availability) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Error checking availability" });
          });
        }

        const hasNoRooms = availability.some((day) => day.available_rooms <= 0);
        if (hasNoRooms) {
          return db.rollback(() => {
            res
              .status(400)
              .json({ error: "Nincs szabad szoba a kiválasztott időszakban!" });
          });
        }

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
                res.status(500).json({ error: "Error creating booking" });
              });
            }

            const updateAvailabilitySql = `
          UPDATE accomodation_availability 
          SET reserved_rooms = reserved_rooms + 1 
          WHERE accomodation_id = ? AND date >= ? AND date < ?
        `;

            db.query(
              updateAvailabilitySql,
              [accommodationId, startDate, endDate],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res
                      .status(500)
                      .json({ error: "Error updating availability" });
                  });
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res
                        .status(500)
                        .json({ error: "Transaction commit error" });
                    });
                  }

                  res.status(201).json({
                    id: result.insertId,
                    message: "Booking created successfully",
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
