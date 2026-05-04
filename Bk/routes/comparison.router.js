const express = require("express");
const router = express.Router();
const comparisonController = require("../controllers/comparison.controller");

router.get("/:userId/:targetId", comparisonController.compareUsers);

module.exports = router;
