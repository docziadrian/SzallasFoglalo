const express = require("express");
const router = express.Router();
const db = require("./db");
const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
const bcrypt = require("bcrypt");

const adminAuth = require("../middlewares/adminAuth");
const requireAuth = require("../middlewares/requireAuth");

const SALT_ROUNDS = 10;

router.get("/", adminAuth, (req, res) => {
  // Felhasználók visszaadása az aktív jelzővel, ha van
  const sql =
    "SELECT id, name, email, role, createdAt, active, is_active FROM users ORDER BY createdAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Hiba a felhasználók lekérésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json(results);
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.session.user);
});

router.patch("/me", requireAuth, (req, res) => {
  const userId = req.session.user.id;

  const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
  const email = typeof req.body.email === "string" ? req.body.email.trim() : undefined;

  if (!name && !email) {
    return res.status(400).json({ error: "Nincs frissíthető mező megadva" });
  }

  if (name !== undefined && name.length < 2) {
    return res.status(400).json({ error: "A név túl rövid" });
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Érvénytelen e-mail cím" });
    }
  }

  const proceedUpdate = () => {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const keys = Object.keys(updates);
    const sql = `UPDATE users SET ${keys.map((k) => k + " = ?").join(", ")} WHERE id = ?`;
    const params = keys.map((k) => updates[k]).concat([userId]);

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("Hiba a profil frissítésekor:", err);
        return res.status(500).json({ error: "Belső szerver hiba" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }

      const nextSessionUser = {
        ...req.session.user,
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
      };
      req.session.user = nextSessionUser;
      res.json({ message: "Profil frissítve", user: nextSessionUser });
    });
  };

  if (email !== undefined) {
    db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, userId],
      (err, results) => {
        if (err) {
          console.error("Hiba az e-mail ellenőrzésekor:", err);
          return res.status(500).json({ error: "Belső szerver hiba" });
        }
        if (results.length > 0) {
          return res.status(400).json({ error: "Az e-mail cím már foglalt" });
        }
        proceedUpdate();
      }
    );
  } else {
    proceedUpdate();
  }
});

router.post("/me/change-password", requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "HIBA! Nem adtál meg minden adatot!" });
  }

  if (!newPassword.match(passwdRegExp)) {
    return res.status(400).json({ error: "HIBA! Az új jelszó nem elég erős!" });
  }

  try {
    db.query(
      "SELECT id, password FROM users WHERE id = ?",
      [userId],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Belső szerver hiba" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "HIBA! Felhasználó nem található!" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
          return res.status(400).json({ error: "HIBA! Hibás jelenlegi jelszó!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedNewPassword, userId],
          (err2) => {
            if (err2) {
              return res.status(500).json({ error: "Belső szerver hiba" });
            }
            res.status(200).json({ success: true, message: "Sikeres jelszó változtatás!" });
          }
        );
      }
    );
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Szerver hiba a jelszó változtatás során!" });
  }
});

router.delete("/me", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Hiba a profil törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    req.session.destroy(() => {
      res.json({ message: "Profil törölve" });
    });
  });
});

// Felhasználó törlése ID alapján (admin)
router.delete("/:id", adminAuth, (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Hiba a felhasználó törlésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Felhasználó törölve" });
  });
});

// Felhasználói mezők frissítése (admin)
router.patch("/:id", adminAuth, (req, res) => {
  const id = req.params.id;
  // engedélyezzük az 'active'-t, hogy az admin engedélyezhesse/tiltassa a felhasználókat a standard PATCH-en keresztül
  const allowed = ["name", "email", "role", "active"];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      // boolean active átalakítása numerikusra MySQL tinyint-hez, ha szükséges
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
    return res.status(400).json({ error: "Nincs szerkeszthető mező megadva" });

  const sql = `UPDATE users SET ${keys
    .map((k) => k + " = ?")
    .join(", ")} WHERE id = ?`;
  const params = keys.map((k) => updates[k]).concat([id]);
  db.query(sql, params, (err, result) => {
    if (err) {
      // Ha a DB-ben nincs 'active' oszlop, a MySQL ER_BAD_FIELD_ERROR-t ad vissza; adjunk vissza egy barátságos üzenetet
      if (err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(400).json({
          error: "A megadott mezők egyike nem létezik a users táblában",
          details: err.message,
        });
      }
      console.error("Hiba a felhasználó frissítésekor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Felhasználó frissítve" });
  });
});

// Aktív/inaktív állapot váltása felhasználónak (próbálja az 'active'-t, majd az 'is_active'-t)
router.patch("/:id/toggle-active", adminAuth, (req, res) => {
  const id = req.params.id;
  const value = req.body.active; // várt boolean
  if (typeof value !== "boolean")
    return res.status(400).json({ error: "Adj meg boolean 'active'-t a body-ban" });

  const tryUpdate = (col, cb) => {
    const sql = `UPDATE users SET ${col} = ? WHERE id = ?`;
    db.query(sql, [value ? 1 : 0, id], (err, result) => {
      if (err) return cb(err);
      return cb(null, result);
    });
  };

  // Próbáljuk az 'active'-t, majd az 'is_active'-t
  tryUpdate("active", (err, r) => {
    if (!err)
      return res.json({ message: "Felhasználó aktív állapota frissítve", column: "active" });
    // próbáljuk az is_active-t
    tryUpdate("is_active", (err2, r2) => {
      if (!err2)
        return res.json({
          message: "Felhasználó aktív állapota frissítve",
          column: "is_active",
        });
      console.error("Hiba a felhasználó aktív állapotának váltásakor:", err, err2);
      res.status(400).json({
        error: "Nem található 'active' oszlop a users táblában vagy a frissítés sikertelen",
      });
    });
  });
});

//BEJELENTKEZÉS metódus
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

        // Jelszó összehasonlítása a hashelt jelszóval
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res
            .status(400)
            .json({ error: "HIBA! Hibás belépési adatok!" });
        }

        // Jelszó eltávolítása a válaszból
        delete user.password;

        // minimális felhasználó tárolása a session-ben az auth ellenőrzésekhez
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

//REGISZTRÁCIÓ metódus
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
    // Ellenőrizzük, hogy az email már létezik-e
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

        // Jelszó hash-elése bcrypt-tel
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Új felhasználó beillesztése (alapértelmezett active = 1)
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
router.patch("/:table/:id/change-password", requireAuth, async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (table !== "users") {
    return res.status(400).json({ error: "Érvénytelen tábla" });
  }

  const sessionUserId = String(req.session.user.id);
  const targetUserId = String(id);
  const isAdmin = req.session.user.role === "admin";
  if (!isAdmin && sessionUserId !== targetUserId) {
    return res.status(403).json({ error: "Nincs jogosultság" });
  }

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

        // Jelenlegi jelszó ellenőrzése
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          user.password
        );

        if (!passwordMatch) {
          return res
            .status(400)
            .json({ error: "HIBA! Hibás jelenlegi jelszó!" });
        }

        // Új jelszó hash-elése
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Jelszó frissítése
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

// Felhasználó kitiltása (ban)
router.patch("/:id/ban", adminAuth, (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE users SET active = 0, is_active = 0 WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Hiba a felhasználó kitiltásakor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Felhasználó kitiltva" });
  });
});

// Felhasználó feloldása (unban)
router.patch("/:id/unban", adminAuth, (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE users SET active = 1, is_active = 1 WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Hiba a felhasználó feloldásakor:", err);
      return res.status(500).json({ error: "Belső szerver hiba" });
    }
    res.json({ message: "Felhasználó feloldva" });
  });
});

module.exports = router;
