require("dotenv").config();

var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
// var fs = require("fs");
// var jwt = require("jsonwebtoken");
var userController = require("./routes/user.router") 
var watchlistController = require("./routes/watchlist.router")
var reviewRouter = require("./routes/review.router")
var favoriteRouter = require("./routes/favorite.router")
var comparisonRouter = require("./routes/comparison.router")
var analyticsRouter = require("./routes/analytics.router")
var mediaRouter = require("./routes/media.router");
var connectDB = require("./db");

 
app.use(cors({
  origin: 'https://watchwisefrontend.onrender.com', // Replace with your actual Render URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connectDB();

app.use("/users",userController)
app.use("/watchlist",watchlistController)
app.use("/reviews", reviewRouter)
app.use("/favorites", favoriteRouter)
app.use("/compare", comparisonRouter)
app.use("/analytics", analyticsRouter)
app.use("/media", mediaRouter)


app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(process.env.PORT || 6767, () => {
  console.log("server running on", process.env.PORT);
});
