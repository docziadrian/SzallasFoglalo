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

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static("assets"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
  })
);

// routes
const adminAuth = require("./middlewares/adminAuth");

// Protected admin routes (require admin role)
const users = require("./modules/users");
app.use("/users", adminAuth, users);

// Public routes
const accomodations = require("./modules/accomodations");
app.use("/accomodations", accomodations);

const bookingsRouter = require("./modules/bookings");
app.use("/bookings", bookingsRouter);

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
