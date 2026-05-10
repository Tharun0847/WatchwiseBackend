var UserModel = require("../model/user.model");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

var UserRegister = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        var newUser = new UserModel({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            preferences: { genres: [] }
        });
        
        await newUser.save();
        res.send({ msg: "User Added"});
    } catch (err) {
        res.status(500).send({ msg: "Error saving user"});
    }
}

var UserLogin = async (req, res) => {
    try {
        const user = await UserModel.findOne({ name: req.body.username });

        if (user) {
            // 1. Try secure bcrypt comparison first
            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(req.body.password, user.password);
            } catch (e) {
                // If it's not a valid hash, it will throw an error
                isMatch = false;
            }

            // 2. Fallback for legacy plain-text passwords
            if (!isMatch && req.body.password === user.password) {
                console.log(`Migrating legacy user: ${user.name}`);
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
                await user.save();
                isMatch = true;
            }

            if (isMatch) {
                var token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET);
                res.send({ 
                  msg: "loginsuccess", 
                  token, 
                  username: req.body.username, 
                  id: user._id, 
                  email: user.email,
                  preferences: user.preferences 
                });
            } else {
                res.send({ msg: "loginfailed" });
            }
        } else {
            res.send({ msg: "loginfailed" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send({ msg: "Internal Server Error" });
    }
};

var updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, oldPassword, newPassword, preferences } = req.body;

  try {
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

    // If attempting to change password
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).send({ msg: "Previous password is required to set a new one" });
      }
      
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).send({ msg: "Incorrect previous password" });
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (preferences) user.preferences = preferences;

    const updatedUser = await user.save();
    res.send({ 
      msg: "Profile Updated", 
      user: { 
        username: updatedUser.name, 
        email: updatedUser.email, 
        id: updatedUser._id,
        preferences: updatedUser.preferences
      } 
    });
  } catch (err) {
    res.status(500).send({ msg: "Error updating profile" });
  }
};

const getAllUsers = (req, res) => {
  UserModel.find({}, { password: 0 }).then(users => {
    res.send(users);
  }).catch(err => {
    res.status(500).send({ msg: "Error fetching users" });
  });
};

const getUserById = (req, res) => {
  const { id } = req.params;
  UserModel.findById(id, { password: 0 }).then(user => {
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
    res.send(user);
  }).catch(err => {
    res.status(500).send({ msg: "Error fetching user" });
  });
};

module.exports = { UserRegister, UserLogin, updateProfile, getAllUsers, getUserById};
