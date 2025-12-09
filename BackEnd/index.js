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
    methods: ["GET", "POST", "PUT", "DELETE"],
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
//const users = require("./modules/users");
//app.use("/users", users);

const accomodations = require("./modules/accomodations");
app.use("/accomodations", accomodations);

// listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
