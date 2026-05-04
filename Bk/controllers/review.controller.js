const Review = require("../model/review.model");

exports.addReview = async (req, res) => {
  try {
    const { userId, username, contentId, type, rating, reviewText } = req.body;
    
    // Check if user already reviewed this content
    const existing = await Review.findOne({ userId, contentId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this content" });
    }

    const newReview = new Review({ userId, username, contentId, type, rating, reviewText });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { contentId } = req.params;
    const reviews = await Review.find({ contentId }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
