var mongoose = require("mongoose");

var PendingUserSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: '10m' } }
});

var PendingUserModel = mongoose.model("PendingUser", PendingUserSchema);
module.exports = PendingUserModel;
