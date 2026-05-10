const router = require("express").Router();
const { UserRegister, UserLogin, updateProfile, getAllUsers, getUserById } = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");

// Public routes
router.post("/register", UserRegister);
router.post("/login", UserLogin);

// Protected routes
router.get("/all", auth, getAllUsers);
router.get("/user/:id", auth, getUserById);
router.put("/update-profile/:id", auth, updateProfile);

module.exports = router;
