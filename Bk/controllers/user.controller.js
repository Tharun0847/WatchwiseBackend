var UserModel = require("../model/user.model");
var jwt = require("jsonwebtoken");

var UserRegister = (req, res) => {
    var newUser = new UserModel({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        preferences: { genres: [] }
    });
    newUser.save().then(() => {
      res.send({ msg: "User Added"});
    }).catch(err => {
      res.status(500).send({ msg: "Error saving user"});
    });
}

var UserLogin = (req, res) => {
  UserModel.findOne({ name: req.body.username, password: req.body.password }).then((user) => {
    if (user) {
        var token = jwt.sign({ username: req.body.username }, "neekendu");
        res.send({ 
          msg: "loginsuccess", 
          token, 
          username: req.body.username, 
          id: user._id, 
          email: user.email,
          preferences: user.preferences 
        });
    }
    else {
        res.send({ msg: "loginfailed" });
    }
  }).catch(err => {
      res.status(500).send({ msg: "Internal Server Error" });
  });
};

var updateProfile = (req, res) => {
  const { id } = req.params;
  const { name, email, password, preferences } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (password) updateData.password = password;
  if (preferences) updateData.preferences = preferences;

  UserModel.findByIdAndUpdate(id, updateData, { new: true })
    .then(user => {
      res.send({ 
        msg: "Profile Updated", 
        user: { 
          username: user.name, 
          email: user.email, 
          id: user._id,
          preferences: user.preferences
        } 
      });
    })
    .catch(err => {
      res.status(500).send({ msg: "Error updating profile" });
    });
};

const getAllUsers = (req, res) => {
  UserModel.find({}, { password: 0 }).then(users => {
    res.send(users);
  }).catch(err => {
    res.status(500).send({ msg: "Error fetching users" });
  });
};

module.exports = { UserRegister, UserLogin, updateProfile, getAllUsers};