const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  contentId: { type: String, required: true },
  type: { type: String, enum: ["movie", "anime"], required: true },
  rating: { type: Number, required: true, min: 1, max: 10 },
  reviewText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ReviewModel = mongoose.model("Review", ReviewSchema);
module.exports = ReviewModel;
