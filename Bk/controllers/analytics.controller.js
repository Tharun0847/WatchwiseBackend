const Watchlist = require("../model/watchlist.model");
const Favorite = require("../model/favorite.model");

exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const [watchlist, favorites] = await Promise.all([
      Watchlist.find({ userId }),
      Favorite.find({ userId })
    ]);

    // 1. Genre Distribution
    const genreCounts = {};
    [...watchlist, ...favorites].forEach(item => {
      item.genres?.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const genreData = Object.entries(genreCounts).map(([name, value]) => ({ name, value }));

    // 2. Status Distribution
    const statusCounts = {
      "Plan to Watch": 0,
      "Currently Watching": 0,
      "Completed": 0
    };
    watchlist.forEach(item => {
      if (statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      }
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 3. Type Distribution
    const movieCount = watchlist.filter(i => i.type === "movie").length;
    const animeCount = watchlist.filter(i => i.type === "anime").length;
    const typeData = [
      { name: "Movies", value: movieCount },
      { name: "Anime", value: animeCount }
    ];

    // 4. Rating Stats
    const ratings = watchlist.filter(i => i.rating).map(i => i.rating);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    res.status(200).json({
      genreData,
      statusData,
      typeData,
      summary: {
        totalItems: watchlist.length,
        favoriteCount: favorites.length,
        avgRating,
        completedCount: statusCounts["Completed"]
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
