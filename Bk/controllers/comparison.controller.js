const Watchlist = require("../model/watchlist.model");
const Favorite = require("../model/favorite.model");
const User = require("../model/user.model");

// Helper to calculate Cosine Similarity for genres
const calculateCosineSimilarity = (vecA, vecB) => {
  const commonKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  commonKeys.forEach(key => {
    const valA = vecA[key] || 0;
    const valB = vecB[key] || 0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  });

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

exports.compareUsers = async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    const [userWatchlist, targetWatchlist, userFavorites, targetFavorites] = await Promise.all([
      Watchlist.find({ userId }),
      Watchlist.find({ userId: targetId }),
      Favorite.find({ userId }),
      Favorite.find({ userId: targetId })
    ]);

    // 1. Overlap Similarity (Jaccard)
    const userIds = new Set(userWatchlist.map(i => i.contentId));
    const targetIds = new Set(targetWatchlist.map(i => i.contentId));
    
    const intersection = new Set([...userIds].filter(id => targetIds.has(id)));
    const union = new Set([...userIds, ...targetIds]);
    
    const overlapScore = union.size === 0 ? 0 : intersection.size / union.size;

    // 2. Genre Similarity (Cosine)
    const getGenreFreq = (items) => {
      const freq = {};
      items.forEach(item => {
        item.genres.forEach(g => {
          freq[g] = (freq[g] || 0) + 1;
        });
      });
      return freq;
    };

    const userGenres = getGenreFreq([...userWatchlist, ...userFavorites]);
    const targetGenres = getGenreFreq([...targetWatchlist, ...targetFavorites]);
    const genreScore = calculateCosineSimilarity(userGenres, targetGenres);

    // 3. Rating Similarity
    let ratingScore = 0;
    let commonCount = 0;
    let totalDiff = 0;

    userWatchlist.forEach(uItem => {
      const tItem = targetWatchlist.find(t => t.contentId === uItem.contentId);
      if (tItem && uItem.rating && tItem.rating) {
        commonCount++;
        totalDiff += Math.abs(uItem.rating - tItem.rating);
      }
    });

    if (commonCount > 0) {
      // Assuming ratings are 1-10 or 1-5. Normalize diff to 0-1 range.
      // If TMDB uses 0-10, max diff is 10.
      const avgDiff = totalDiff / commonCount;
      ratingScore = 1 - (avgDiff / 10); 
    } else {
      ratingScore = 0.5; // Neutral if no common rated items
    }

    // Final Score: (Overlap × 0.4) + (Genre × 0.4) + (Rating × 0.2)
    const finalScore = (overlapScore * 0.4) + (genreScore * 0.4) + (ratingScore * 0.2);

    // Identify shared items and recommendations
    const sharedItems = userWatchlist.filter(i => targetIds.has(i.contentId));
    const targetUnique = targetWatchlist.filter(i => !userIds.has(i.contentId));
    const recommendations = targetUnique.slice(0, 5); // Simple: suggest 5 things they watched that you haven't

    res.status(200).json({
      score: (finalScore * 100).toFixed(1),
      overlapScore: (overlapScore * 100).toFixed(1),
      genreScore: (genreScore * 100).toFixed(1),
      ratingScore: (ratingScore * 100).toFixed(1),
      sharedCount: intersection.size,
      sharedItems: sharedItems.map(i => ({ title: i.title, image: i.image, type: i.type })),
      recommendations: recommendations.map(i => ({ title: i.title, image: i.image, type: i.type, contentId: i.contentId })),
      commonGenres: Object.keys(userGenres).filter(g => targetGenres[g]).slice(0, 5)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
