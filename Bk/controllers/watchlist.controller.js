const Watchlist = require("../model/watchlist.model");

exports.addToWatchlist = async (req, res) => {
  try {
    const { userId, contentId, title, image, rating, genres, type, status } = req.body;
    console.log("Adding to watchlist:", { userId, contentId, title, type, genres });

    if (!userId || !contentId) {
      return res.status(400).json({ message: "userId and contentId are required" });
    }
    
    // Check if already exists
    const existing = await Watchlist.findOne({ userId, contentId });
    if (existing) {
      return res.status(400).json({ message: "Already in watchlist" });
    }

    const newItem = new Watchlist({ userId, contentId, title, image, rating, genres, type, status });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Backend Error adding to watchlist:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const items = await Watchlist.find({ userId }).sort({ timeStamp: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error("Backend Error getting watchlist:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { id } = req.params;
    await Watchlist.findByIdAndDelete(id);
    res.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Watchlist.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
