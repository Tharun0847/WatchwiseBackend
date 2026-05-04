var mongoose = require("mongoose");
var UserSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  preferences: {
    genres: [String]
  },
  timeStamp: { type: Date, default: Date.now },
});

var UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
