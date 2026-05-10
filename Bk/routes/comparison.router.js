const express = require("express");
const router = express.Router();
const comparisonController = require("../controllers/comparison.controller");
const auth = require("../middleware/auth.middleware");

router.get("/:userId/:targetId", auth, comparisonController.compareUsers);

module.exports = router;
