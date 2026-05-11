const router = require("express").Router();
const { 
    UserRegister, 
    UserLogin, 
    updateProfile, 
    getAllUsers, 
    getUserById,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    changeEmail,
    verifyResetOTP
} = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");

// Public routes
router.post("/register", UserRegister);
router.post("/login", UserLogin);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password/:token", resetPassword);
router.post("/change-email", changeEmail);

// Protected routes
router.get("/all", auth, getAllUsers);
router.get("/user/:id", auth, getUserById);
router.put("/update-profile/:id", auth, updateProfile);

module.exports = router;
