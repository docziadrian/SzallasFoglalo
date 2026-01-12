require("dotenv").config();
const express = require("express");
var session = require("express-session");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");

// CORS beállítások
app.use(
  cors({
    origin: "http://localhost:4200", // Frontend URL-je
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Nyers body-ra van szükségünk a Stripe webhookhoz; mountoljuk a webhook útvonalat az express.json előtt
const { handleStripeWebhook } = require("./modules/payments");
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static("assets"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
);

// routes
const adminAuth = require("./middlewares/adminAuth");

const users = require("./modules/users");

// Nyilvános auth/session végpontok
app.post("/users/login", users);
app.post("/users/registration", users);
app.get("/users/me", users);

// Védett admin felhasználó kezelési végpontok
app.use("/users", users);

// Nyilvános útvonalak
const accomodations = require("./modules/accomodations");
app.use("/accomodations", accomodations);

const bookingsRouter = require("./modules/bookings");
app.use("/bookings", bookingsRouter);

// Fizetések (Stripe)
// Nyers body elemzésre van szükség a webhook útvonalhoz; mountoljuk a payments routert, ami belsőleg express.raw-t használ
const paymentsRouter = require("./modules/payments");
app.use("/payments", paymentsRouter);

const aichatRouter = require("./modules/aichat");
app.use("/aichat", aichatRouter);

const accomodationImages = require("./modules/accomodation_images");
app.use("/accomodation_images", accomodationImages);

const reviewsRouter = require("./modules/reviews");
app.use("/reviews", adminAuth, reviewsRouter);

// rooms endpoint scaffold - szobák tárolása szállásonként az accomodation_images táblában type='room' értékkel
const roomsRouter = require("./modules/rooms");
app.use("/rooms", adminAuth, roomsRouter);

const couponsRouter = require("./modules/coupons");
app.use("/coupons", couponsRouter);

// listening
app.listen(port, () => {
  console.log(`Szerver a ${port} porton hallgazdik...`);
});
