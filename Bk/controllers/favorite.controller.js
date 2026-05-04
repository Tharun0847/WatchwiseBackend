const Favorite = require("../model/favorite.model");

exports.addFavorite = async (req, res) => {
  try {
    const { userId, contentId, title, image, rating, genres, type } = req.body;
    
    const existing = await Favorite.findOne({ userId, contentId });
    if (existing) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const newFavorite = new Favorite({ userId, contentId, title, image, rating, genres, type });
    await newFavorite.save();
    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    await Favorite.findByIdAndDelete(id);
    res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
