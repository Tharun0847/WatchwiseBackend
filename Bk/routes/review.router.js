const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const auth = require("../middleware/auth.middleware");

router.post("/add", auth, reviewController.addReview);
router.get("/:contentId", reviewController.getReviews);
router.delete("/delete/:id", auth, reviewController.deleteReview);

module.exports = router;
