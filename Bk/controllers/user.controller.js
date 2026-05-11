var UserModel = require("../model/user.model");
var PendingUserModel = require("../model/pendingUser.model");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var crypto = require("crypto");
var sendEmail = require("../utils/email");

var UserRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // 1. Check if email already exists in main collection
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).send({ msg: "User already exists with this email" });
        }

        // 2. Check if username already exists in main collection
        const existingUsername = await UserModel.findOne({ name });
        if (existingUsername) {
            return res.status(400).send({ msg: "Username already exists. Please choose another one." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // 3. Save to PendingUser collection (Upsert if same email exists)
        await PendingUserModel.findOneAndUpdate(
            { email },
            { name, email, password: hashedPassword, otp, otpExpires, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Send OTP via Email
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
            res.status(500).send({ msg: "Failed to send OTP. Please try again." });
        }

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).send({ msg: "Error processing registration" });
    }
}

var verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Find in PendingUser collection
        const pendingUser = await PendingUserModel.findOne({ 
            email, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!pendingUser) {
            return res.status(400).send({ msg: "Invalid or expired OTP" });
        }

        // 4. Promote to main UserModel
        const newUser = new UserModel({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            isVerified: true,
            preferences: { genres: [] }
        });

        await newUser.save();

        // 5. Remove from PendingUser
        await PendingUserModel.deleteOne({ _id: pendingUser._id });

        res.send({ msg: "Email verified successfully. Registration complete." });
    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).send({ msg: "Error verifying OTP" });
    }
};

var resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find in PendingUser
        const pendingUser = await PendingUserModel.findOne({ email });

        if (!pendingUser) {
            return res.status(404).send({ msg: "Registration session expired. Please sign up again." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pendingUser.otp = otp;
        pendingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        pendingUser.createdAt = Date.now(); // Reset the 10-minute deletion timer
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

var forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).send({ msg: "No user with that email" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

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

var resetPassword = async (req, res) => {
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
                  isVerified: user.isVerified,
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

var changeEmail = async (req, res) => {
    try {
        const { oldEmail, newEmail } = req.body;
        
        // 1. Check if new email is already in use in main collection
        const existingUser = await UserModel.findOne({ email: newEmail });
        if (existingUser) {
            return res.status(400).send({ msg: "This email is already registered to another account" });
        }

        // 2. Check if user is in main collection
        let user = await UserModel.findOne({ email: oldEmail });
        let isPending = false;

        // 3. If not in main, check Pending collection
        if (!user) {
            user = await PendingUserModel.findOne({ email: oldEmail });
            isPending = true;
        }

        if (!user) {
            return res.status(404).send({ msg: "User not found" });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (isPending) {
            // Update Pending user
            user.email = newEmail;
            user.otp = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000;
            user.createdAt = Date.now(); // Reset TTL timer
            await user.save();
        } else {
            // Update main user
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

var verifyResetOTP = async (req, res) => {
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

module.exports = { UserRegister, UserLogin, updateProfile, getAllUsers, getUserById, verifyOTP, resendOTP, forgotPassword, resetPassword, changeEmail, verifyResetOTP };
