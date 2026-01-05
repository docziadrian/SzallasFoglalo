const express = require("express");
const router = express.Router();
const db = require("./db");
const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

router.get("/", (req, res) => {
  // Return users including their active flag if present
  const sql =
    "SELECT id, name, email, role, createdAt, active, is_active FROM users ORDER BY createdAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});

//DELETE user by id (admin)
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "User deleted" });
  });
});

// Update user fields (admin)
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  // allow 'active' so admin can enable/disable users via standard PATCH
  const allowed = ["name", "email", "role", "active"];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      // convert boolean active to numeric for MySQL tinyint if necessary
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

  const sql = `UPDATE users SET ${keys
    .map((k) => k + " = ?")
    .join(", ")} WHERE id = ?`;
  const params = keys.map((k) => updates[k]).concat([id]);
  db.query(sql, params, (err, result) => {
    if (err) {
      // If the DB doesn't have 'active' column, MySQL will return ER_BAD_FIELD_ERROR; surface a friendly message
      if (err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(400).json({
          error: "One of the supplied fields doesn't exist on users table",
          details: err.message,
        });
      }
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "User updated" });
  });
});

// Toggle active/inactive for user (tries 'active' then 'is_active')
router.patch("/:id/toggle-active", (req, res) => {
  const id = req.params.id;
  const value = req.body.active; // expected boolean
  if (typeof value !== "boolean")
    return res.status(400).json({ error: "Provide boolean `active` in body" });

  const tryUpdate = (col, cb) => {
    const sql = `UPDATE users SET ${col} = ? WHERE id = ?`;
    db.query(sql, [value ? 1 : 0, id], (err, result) => {
      if (err) return cb(err);
      return cb(null, result);
    });
  };

  // Try 'active' then 'is_active'
  tryUpdate("active", (err, r) => {
    if (!err)
      return res.json({ message: "User active updated", column: "active" });
    // try is_active
    tryUpdate("is_active", (err2, r2) => {
      if (!err2)
        return res.json({
          message: "User active updated",
          column: "is_active",
        });
      console.error("Error toggling active on users:", err, err2);
      res.status(400).json({
        error: "No 'active' column found on users table or update failed",
      });
    });
  });
});

//LOGIN method
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const table = "users";

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "HIBA! Nem adtál meg minden adatot!" });
  }

  console.log("email: " + email);

  try {
    db.query(
      `SELECT * FROM ${table} WHERE email = ?`,
      [email],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
          return res
            .status(400)
            .json({ error: "HIBA! Hibás belépési adatok!" });
        }

        const user = results[0];

        // Compare password with hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res
            .status(400)
            .json({ error: "HIBA! Hibás belépési adatok!" });
        }

        // Remove password from response
        delete user.password;

        // store minimal user in session for auth checks
        if (req.session) {
          req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active || user.is_active || 1,
          };
        }

        console.log(
          `[POST /${table}/login] -> Sikeres bejelentkezés: ${email}`
        );
        res.status(200).json(user);
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Szerver hiba a bejelentkezés során!" });
  }
});

//REGISTER method
router.post("/registration", async (req, res) => {
  const table = "users";
  const { name, email, password, confirm } = req.body;

  if (!name || !email || !password || !confirm) {
    return res
      .status(400)
      .json({ error: "HIBA! Nem adtál meg minden adatot!" });
  }

  if (password !== confirm) {
    return res
      .status(400)
      .json({ error: "HIBA! Nem egyezik az általad megadott két jelszó!" });
  }

  if (!password.match(passwdRegExp)) {
    return res
      .status(400)
      .json({ error: "HIBA! Az általad megadott jelszó nem elég erős!" });
  }

  try {
    // Check if email already exists
    db.query(
      `SELECT id FROM ${table} WHERE email=?`,
      [email],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (results.length !== 0) {
          return res.status(400).json({
            error: "HIBA! Az általad választott e-mail cím már foglalt!",
          });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user (default active = 1)
        db.query(
          `INSERT INTO ${table} (name, email, password, role, active) VALUES (?,?,?, 'user', 1)`,
          [name, email, hashedPassword],
          (err, results) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            console.log(
              `[POST /${table}/registration] -> 1 új felhasználó regisztrálva: ${email}`
            );

            const registeredUser = {
              id: results.insertId,
              name,
              email,
              role: "user",
              active: 1,
            };

            res.status(200).json(registeredUser);
          }
        );
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Szerver hiba a regisztráció során!" });
  }
});

// Jelszó változtatás
router.patch("/:table/:id/change-password", async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "HIBA! Nem adtál meg minden adatot!" });
  }

  if (!newPassword.match(passwdRegExp)) {
    return res.status(400).json({ error: "HIBA! Az új jelszó nem elég erős!" });
  }

  try {
    // User jelenlegi jelszava,
    db.query(
      `SELECT id, password FROM ${table} WHERE id = ?`,
      [id],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ error: "HIBA! Felhasználó nem található!" });
        }

        const user = results[0];

        // Verify current password
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          user.password
        );

        if (!passwordMatch) {
          return res
            .status(400)
            .json({ error: "HIBA! Hibás jelenlegi jelszó!" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        db.query(
          `UPDATE ${table} SET password = ? WHERE id = ?`,
          [hashedNewPassword, id],
          (err, results) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            console.log(
              `[PATCH /${table}/${id}/change-password] -> Jelszó frissítve.`
            );

            res.status(200).json({
              success: true,
              message: "Sikeres jelszó változtatás!",
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Szerver hiba a jelszó változtatás során!" });
  }
});

module.exports = router;
