const router = require("express").Router()

const { UserRegister, UserLogin, updateProfile, getAllUsers } = require("../controllers/user.controller");

router
  .post("/register", UserRegister)
  .post("/login", UserLogin)
  .get("/all", getAllUsers)
  .put("/update-profile/:id", updateProfile)

module.exports = router;