var mongoose = require("mongoose");
var UserSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferences: {
    genres: [String]
  },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  timeStamp: { type: Date, default: Date.now },
});

var UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
