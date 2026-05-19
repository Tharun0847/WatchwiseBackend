const express = require("express");
const router = express.Router();
const dislikeController = require("../controllers/dislike.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

router.post("/add", dislikeController.addDislike);
router.get("/:userId", dislikeController.getDislikes);
router.delete("/remove/:id", dislikeController.removeDislike);

module.exports = router;
