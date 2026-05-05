const mongoose = require("mongoose");
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sendEmail } = require("../utils/email");
const Bvn = require("../models/bvnModel");
const Account = require("../models/acountModel");
const axios = require("axios");
// const { insertBvn, createAccount } = require("../config/apiAdapter");
const NibssService = require("../services/nibssServices");

// Helper function to generate JWT

// Helper function to generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieExpires = new Date(
    Date.now() +
      parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  );

  const cookieOptions = {
    expires: cookieExpires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    dob,
    phone,
    bvn,
    pin,
  } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Passwords do not match",
    });
  }

  try {
    // Prepare payloads
    const bvnPayload = {
      bvn,
      firstName,
      lastName: lastName?.trim() || "",
      dob,
      phone,
    };

    const accountPayload = { kycType: "bvn", kycID: bvn, dob };

    // NIBSS Calls
    const bvnResponse = await NibssService.insertBvn(bvnPayload);
    const accountResponse = await NibssService.createAccount(accountPayload);

    // Save to Database
    await Bvn.create(bvnPayload);

    const newAccount = await Account.create({
      nibssResponse: accountResponse,
      kycType: accountResponse?.account?.kycType,
      kycID: accountResponse?.account?.kycID,
      accountNumber: accountResponse?.account?.accountNumber,
      accountName: accountResponse?.account?.accountName,
      dob: accountPayload.dob,
      bankCode: accountResponse?.account?.bankCode,
      fintechId: accountResponse?.account?.fintechId,
      balance: accountResponse?.account?.balance,
    });

    // Create User and link Account
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      bvn,
      password,
      pin,
      account: newAccount._id,
    });

    // Link User back to Account
    newAccount.user = newUser._id;
    await newAccount.save();

    // Send Welcome Email
    if (sendEmail) {
      await sendEmail("welcome", newUser, {
        accountNumber: newAccount?.accountNumber,
      });
    }

    const token = signToken(newUser._id);

    res.status(201).json({
      status: "success",
      token,
      nibssData: { bvnResponse, accountResponse },
      data: {
        user: newUser,
        account: newAccount,
      },
    });
  } catch (error) {
    console.error("🚨 SIGNUP ERROR:", error.message);
    console.error("Full Error:", error);

    return res.status(400).json({
      status: "fail",
      message: error.message || "Registration failed. Please try again.",
    });
  }
});

// LOGIN

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        status: "fail",
        message: "Account is locked. Please contact support.",
      });
    }

    const isCorrect = await user.correctPassword(password, user.password);

    if (!isCorrect) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }

      await user.save();

      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    const token = signToken(user._id);

    user.password = undefined;

    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong during login",
    });
  }
});

// GET CURRENT USER
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ status: "success", data: { user } });
});

// UPDATE USER PROFILE
exports.updateMe = catchAsync(async (req, res, next) => {
  // Filter out unwanted field names that are not allowed to be updated
  const filteredBody = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
  };

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: "success", data: { user: updatedUser } });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "Not logged in" });

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return res.status(401).json({ message: "User no longer exists" });

  // Check if password changed after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({ message: "Password recently changed" });
  }

  req.user = currentUser;
  next();
});

// FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ status: "fail", message: "Please provide your email" });
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res
      .status(404)
      .json({ status: "fail", message: "No user found with this email" });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await sendEmail("passwordReset", user, { resetURL });

    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    console.error("Error sending email:", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "fail",
      message: "Failed to send email. Please try again later.",
    });
  }
});

// RESET PASSWORD

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get hashed token from URL
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2. Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }

  // 3. Validate passwords
  if (!req.body.password || !req.body.passwordConfirm) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide password and confirm password",
    });
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return res.status(400).json({
      status: "fail",
      message: "Passwords do not match",
    });
  }

  if (req.body.password.length < 8) {
    return res.status(400).json({
      status: "fail",
      message: "Password must be at least 8 characters long",
    });
  }

  // 4. Update password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  // 5. Send success response with new token (auto login)
  createSendToken(user, 200, res);
});
