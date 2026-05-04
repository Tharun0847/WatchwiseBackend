var mongoose = require("mongoose");

var WatchlistSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contentId: { type: String, required: true },
  title: String,
  image: String,
  rating: Number,
  genres: [String],
  type: { type: String, enum: ["movie", "anime"], required: true },
  status: { 
    type: String, 
    enum: ["Plan to Watch", "Currently Watching", "Completed"], 
    default: "Plan to Watch" 
  },
  timeStamp: { type: Date, default: Date.now },
});

var WatchlistModel = mongoose.model("Watchlist", WatchlistSchema);
module.exports = WatchlistModel;
