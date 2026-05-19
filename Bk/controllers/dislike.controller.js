const Dislike = require("../model/dislike.model");

exports.addDislike = async (req, res) => {
  try {
    const { userId, contentId, title, image, rating, genres, type } = req.body;
    
    const existing = await Dislike.findOne({ userId, contentId });
    if (existing) {
      return res.status(400).json({ message: "Already in dislikes" });
    }

    const newDislike = new Dislike({ userId, contentId, title, image, rating, genres, type });
    await newDislike.save();
    res.status(201).json(newDislike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDislikes = async (req, res) => {
  try {
    const { userId } = req.params;
    const dislikes = await Dislike.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(dislikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeDislike = async (req, res) => {
  try {
    const { id } = req.params;
    await Dislike.findByIdAndDelete(id);
    res.status(200).json({ message: "Removed from dislikes" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
