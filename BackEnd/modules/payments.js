const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const db = require("./db");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getFrontendBaseUrl() {
  const raw = (process.env.FRONTEND_URL || "").trim();
  if (!raw) return "http://localhost:4200";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `http://${raw}`;
}

// Stripe Checkout session létrehozása egy foglaláshoz
router.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      userId,
      accommodationId,
      startDate,
      endDate,
      persons,
      totalPrice,
      bookingName,
    } = req.body;

    // szállás lekérése a névhez
    db.query(
      "SELECT id, name FROM accomodations WHERE id = ?",
      [accommodationId],
      async (err, rows) => {
        if (err) {
          console.error("Hiba a szállás lekérésekor fizetéshez:", err);
          return res
            .status(500)
            .json({ message: "Hiba a szállás lekérésekor" });
        }

        const accName =
          rows && rows.length
            ? rows[0].name
            : `Szállás #${accommodationId}`;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: { name: `Foglalás: ${accName}` },
                unit_amount: Math.round((parseFloat(totalPrice) || 0) * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          metadata: {
            booking: JSON.stringify({
              userId,
              accommodationId,
              startDate,
              endDate,
              persons,
              totalPrice,
              bookingName,
            }),
          },
          success_url: `${getFrontendBaseUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getFrontendBaseUrl()}/payment-cancel`,
        });

        return res.json({
          sessionId: session.id,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
      }
    );
  } catch (error) {
    console.error("Hiba a checkout session létrehozásakor:", error);
    res.status(500).json({ message: "Nem sikerült létrehozni a checkout sessiont" });
  }
});

// Webhook endpoint a Stripe események fogadásához
// Megjegyzés: a stripe javasolja a nyers body-t az aláírás ellenőrzéséhez; ez a fájl azt várja, hogy az app express.raw-val mountolja
// Megjegyzés: a stripe javasolja a nyers body-t az aláírás ellenőrzéséhez; exportálunk egy handlert, hogy az index.js express.raw-val mountolhassa
function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook aláírás ellenőrzése sikertelen:", err.message);
    return res.status(400).send(`Webhook Hiba: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // használjuk a megosztott helper funkciót
    insertBookingFromSession(session)
      .then(() => {
        console.log("Webhook: foglalás beillesztve");
      })
      .catch((err) => {
        console.error("Webhook: foglalás beillesztése sikertelen", err);
      });
  }

  res.json({ received: true });
}

// tartsuk meg a router végpontot a kényelem kedvéért (ha a webhook routerral van mountolva, csak akkor működik, ha a nyers body megmarad)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Helper funkció a foglalás beillesztéséhez a sessionből
async function insertBookingFromSession(session) {
  if (
    session.payment_status === "paid" &&
    session.metadata &&
    session.metadata.booking
  ) {
    try {
      const booking = JSON.parse(session.metadata.booking);

      const sql = `INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status, createdAt, bookingName) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
      const params = [
        booking.userId,
        booking.accommodationId,
        booking.startDate,
        booking.endDate,
        booking.persons,
        booking.totalPrice,
        "confirmed",
        booking.bookingName || null,
      ];

      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    } catch (err) {
      throw err;
    }
  }
  return null;
}

// Manuális ellenőrzés és foglalás beillesztése, ha a webhook sikertelen
router.post("/verify-booking", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId)    return res.status(400).json({ message: "Hiányzó sessionId" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      let bookingDetails = null;
      try {
        if (session.metadata && session.metadata.booking) {
          bookingDetails = JSON.parse(session.metadata.booking);

          const accId = bookingDetails.accommodationId;
          if (accId) {
            const accName = await new Promise((resolve) => {
              db.query(
                "SELECT name FROM accomodations WHERE id = ?",
                [accId],
                (e, rows) => {
                  if (e || !rows || !rows.length) return resolve(null);
                  resolve(rows[0].name);
                }
              );
            });
            if (accName) bookingDetails.accommodationName = accName;
          }
        }
      } catch (e) {
        bookingDetails = null;
      }

      try {
        await insertBookingFromSession(session);
        return res.json({
          success: true,
          message: "Foglalás ellenőrizve/beillesztve",
          booking: bookingDetails,
        });
      } catch (dbErr) {
        console.error("Foglalás beillesztési hiba", dbErr);
        return res.json({
          success: true,
          message: "Foglalás feldolgozva (vagy hiba a DB-ben)",
          booking: bookingDetails,
        });
      }
    } else {
      return res.status(400).json({ message: "A fizetés nem sikeres" });
    }
  } catch (err) {
    console.error("Ellenőrzési hiba", err);
    return res.status(500).json({ message: "Hiba a fizetés ellenőrzésekor" });
  }
});

module.exports = router;
module.exports.handleStripeWebhook = handleStripeWebhook;
