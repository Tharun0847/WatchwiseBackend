const UserModel = require("../model/user.model");
const PendingUserModel = require("../model/pendingUser.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/email");

const UserRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).send({ msg: "User already exists with this email" });
        }

        const existingUsername = await UserModel.findOne({ name });
        if (existingUsername) {
            return res.status(400).send({ msg: "Username already exists. Please choose another one." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        await PendingUserModel.findOneAndUpdate(
            { email },
            { name, email, password: hashedPassword, otp, otpExpires, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        try {
            await sendEmail({
                email: email,
                subject: 'Verify your account',
                message: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
                html: `<h1>Verify your account</h1><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
            });
            res.send({ msg: "OTP sent to email. Please verify to complete registration." });
        } catch (emailErr) {
            console.error("Email Error:", emailErr);
            // Put the error directly in the message so it shows on the UI
            res.status(500).send({ 
                msg: `Email Error: ${emailErr.message}. Verify your Render Environment Variables.`,
                error: emailErr.message
            });
        }

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).send({ msg: "Error processing registration" });
    }
}

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const pendingUser = await PendingUserModel.findOne({ 
            email, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!pendingUser) {
            return res.status(400).send({ msg: "Invalid or expired OTP" });
        }

        const newUser = new UserModel({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            isVerified: true,
            preferences: { genres: [] }
        });

        await newUser.save();
        await PendingUserModel.deleteOne({ _id: pendingUser._id });

        res.send({ msg: "Email verified successfully. Registration complete." });
    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).send({ msg: "Error verifying OTP" });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const pendingUser = await PendingUserModel.findOne({ email });

        if (!pendingUser) {
            return res.status(404).send({ msg: "Registration session expired. Please sign up again." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pendingUser.otp = otp;
        pendingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        pendingUser.createdAt = Date.now();
        await pendingUser.save();

        await sendEmail({
            email: pendingUser.email,
            subject: 'New Verification Code',
            message: `Your new verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `<h1>Verify your account</h1><p>Your new verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
        });

        res.send({ msg: "New OTP sent to email" });
    } catch (err) {
        res.status(500).send({ msg: "Error resending OTP" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).send({ msg: "No user with that email" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
                html: `<h1>Password Reset</h1><p>Your password reset OTP is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`
            });
            res.send({ msg: "OTP sent to email" });
        } catch (emailErr) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).send({ msg: "Error sending email" });
        }
    } catch (err) {
        res.status(500).send({ msg: "Error processing forgot password" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await UserModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ msg: "Invalid or expired reset token" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.send({ msg: "Password reset successful" });
    } catch (err) {
        res.status(500).send({ msg: "Error resetting password" });
    }
};

const UserLogin = async (req, res) => {
    try {
        const user = await UserModel.findOne({ name: req.body.username });

        if (user) {
            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(req.body.password, user.password);
            } catch (e) {
                isMatch = false;
            }

            if (!isMatch && req.body.password === user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
                await user.save();
                isMatch = true;
            }

            if (isMatch) {
                const token = jwt.sign(
                    { username: req.body.username, id: user._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                const isProduction = process.env.NODE_ENV === "production";

                // Set HttpOnly Cookie
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                res.send({ 
                  msg: "loginsuccess", 
                  username: req.body.username, 
                  id: user._id, 
                  email: user.email,
                  profilePic: user.profilePic,
                  isVerified: user.isVerified,
                  preferences: user.preferences 
                });
            } else {
                res.status(401).send({ msg: "loginfailed" });
            }
        } else {
            res.status(401).send({ msg: "loginfailed" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send({ msg: "Internal Server Error" });
    }
};

const logout = (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    });
    res.send({ msg: "loggedout" });
};

const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, oldPassword, newPassword, preferences, profilePic } = req.body;

  try {
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

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
    if (profilePic !== undefined) user.profilePic = profilePic;

    const updatedUser = await user.save();
    res.send({ 
      msg: "Profile Updated", 
      user: { 
        username: updatedUser.name, 
        email: updatedUser.email, 
        id: updatedUser._id,
        preferences: updatedUser.preferences,
        profilePic: updatedUser.profilePic
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

const changeEmail = async (req, res) => {
    try {
        const { oldEmail, newEmail } = req.body;
        
        const existingUser = await UserModel.findOne({ email: newEmail });
        if (existingUser) {
            return res.status(400).send({ msg: "This email is already registered to another account" });
        }

        let user = await UserModel.findOne({ email: oldEmail });
        let isPending = false;

        if (!user) {
            user = await PendingUserModel.findOne({ email: oldEmail });
            isPending = true;
        }

        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (isPending) {
            user.email = newEmail;
            user.otp = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000;
            user.createdAt = Date.now();
            await user.save();
        } else {
            user.email = newEmail;
            user.otp = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000;
            await user.save();
        }

        await sendEmail({
            email: newEmail,
            subject: 'Verify your new email',
            message: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `<h1>Verify your account</h1><p>You updated your email. Your new verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
        });

        res.send({ msg: "Email updated and new OTP sent", email: newEmail });
    } catch (err) {
        console.error("Change Email Error:", err);
        res.status(500).send({ msg: "Error updating email" });
    }
};

const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await UserModel.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ msg: "Invalid or expired OTP" });
        }

        res.send({ msg: "OTP verified" });
    } catch (err) {
        res.status(500).send({ msg: "Error verifying OTP" });
    }
};

module.exports = { UserRegister, UserLogin, logout, updateProfile, getAllUsers, getUserById, verifyOTP, resendOTP, forgotPassword, resetPassword, changeEmail, verifyResetOTP };
