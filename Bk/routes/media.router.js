const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/media.controller");

// Anime Routes
router.get("/anime/top", mediaController.getTopAnime);
router.get("/anime/trending", mediaController.getTrendingAnime);
router.get("/anime/high-rated", mediaController.getRecentHighRatedAnime);
router.get("/anime/search", mediaController.searchAnime);
router.get("/anime/genres", mediaController.getAnimeGenres);
router.get("/anime/by-genre", mediaController.getAnimeByGenre);
router.get("/anime/:id", mediaController.getAnimeDetails);
router.get("/anime/:id/recommendations", mediaController.getAnimeRecommendations);

// Movie Routes
router.get("/movie/popular", mediaController.getPopularMovies);
router.get("/movie/search", mediaController.searchMovies);
router.get("/movie/genres", mediaController.getMovieGenres);
router.get("/movie/by-genre", mediaController.getMoviesByGenre);
router.get("/movie/:id", mediaController.getMovieDetails);
router.get("/movie/:id/recommendations", mediaController.getMovieRecommendations);

module.exports = router;
