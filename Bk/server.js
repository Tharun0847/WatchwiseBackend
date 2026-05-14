const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const userController = require("./routes/user.router");
const watchlistController = require("./routes/watchlist.router");
const reviewRouter = require("./routes/review.router");
const favoriteRouter = require("./routes/favorite.router");
const comparisonRouter = require("./routes/comparison.router");
const analyticsRouter = require("./routes/analytics.router");
const mediaRouter = require("./routes/media.router");
const connectDB = require("./db");

// Global Rate Limiter: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use(limiter);

const allowedOrigins = [
  'https://watchwisefrontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connectDB();

app.use("/users", userController);
app.use("/watchlist", watchlistController);
app.use("/reviews", reviewRouter);
app.use("/favorites", favoriteRouter);
app.use("/compare", comparisonRouter);
app.use("/analytics", analyticsRouter);
app.use("/media", mediaRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(process.env.PORT || 6767, () => {
  console.log("server running on", process.env.PORT || 6767);
});
