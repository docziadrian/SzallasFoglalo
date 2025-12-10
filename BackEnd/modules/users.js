const express = require("express");
const router = express.Router();
const db = require("./db");
const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

router.get("/", (req, res) => {
  res.status(200).send("Userek itt futnak");
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

        // Insert new user
        db.query(
          `INSERT INTO ${table} (name, email, password, role) VALUES (?,?,?, 'user')`,
          [name, email, hashedPassword],
          (err, results) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            console.log(
              `[POST /${table}/registration] -> 1 új felhasználó regisztrálva: ${email}`
            );

            /* //TODO: Email küldés regisztráció után
            const transporter = nodemailer.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: {
                user: "maddison53@ethereal.email",
                pass: "jn7jnAPss4f63QBp6D",
              },
            });

            (async () => {
              const info = await transporter.sendMail({
                from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
                to: email,
                subject: "Sikeres regisztráció ✔",
                text: `Kedves ${name}! Sikeresen regisztráltál az oldalunkon!`,
                html: `<b>Kedves ${name}!</b><p>Sikeresen regisztráltál az oldalunkon!</p>`,
              });

              console.log("Message sent:", info.messageId);
            })();
            */

            const registeredUser = {
              id: results.insertId,
              name,
              email,
              role: "user",
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
