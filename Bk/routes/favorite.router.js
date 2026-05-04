const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favorite.controller");

router.post("/add", favoriteController.addFavorite);
router.get("/:userId", favoriteController.getFavorites);
router.delete("/remove/:id", favoriteController.removeFavorite);

module.exports = router;
