const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contentId: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  rating: Number,
  genres: [String],
  type: { type: String, enum: ["movie", "anime"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const FavoriteModel = mongoose.model("Favorite", FavoriteSchema);
module.exports = FavoriteModel;
