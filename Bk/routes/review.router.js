const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

router.post("/add", reviewController.addReview);
router.get("/:contentId", reviewController.getReviews);
router.delete("/delete/:id", reviewController.deleteReview);

module.exports = router;
