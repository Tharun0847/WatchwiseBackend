const express = require("express");
const router = express.Router();
const watchlistController = require("../controllers/watchlist.controller");
const auth = require("../middleware/auth.middleware");

// Protect all routes in this router
router.use(auth);

router.post("/add", watchlistController.addToWatchlist);
router.get("/:userId", watchlistController.getWatchlist);
router.delete("/remove/:id", watchlistController.removeFromWatchlist);
router.put("/update-status/:id", watchlistController.updateStatus);

module.exports = router;
