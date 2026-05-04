const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");

router.get("/:userId", analyticsController.getUserStats);

module.exports = router;
