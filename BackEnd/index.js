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

// We need raw body for Stripe webhook; mount the webhook route before express.json
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

// Public auth/session endpoints
app.post("/users/login", users);
app.post("/users/registration", users);
app.get("/users/me", users);

// Protected admin user management endpoints
app.use("/users", users);

// Public routes
const accomodations = require("./modules/accomodations");
app.use("/accomodations", accomodations);

const bookingsRouter = require("./modules/bookings");
app.use("/bookings", bookingsRouter);

// Payments (Stripe)
// We need raw body parsing for the webhook route; mount payments router which uses express.raw internally
const paymentsRouter = require("./modules/payments");
app.use("/payments", paymentsRouter);

const aichatRouter = require("./modules/aichat");
app.use("/aichat", aichatRouter);

const accomodationImages = require("./modules/accomodation_images");
app.use("/accomodation_images", accomodationImages);

const reviewsRouter = require("./modules/reviews");
app.use("/reviews", adminAuth, reviewsRouter);

// rooms endpoint scaffold - store rooms per accomodation in accomodation_images with type='room'
const roomsRouter = require("./modules/rooms");
app.use("/rooms", adminAuth, roomsRouter);

// listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
