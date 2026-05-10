const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const auth = require("../middleware/auth.middleware");

router.get("/:userId", auth, analyticsController.getUserStats);

module.exports = router;
