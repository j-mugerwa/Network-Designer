const User = require("../models/UserModel");
const asyncHandler = require("express-async-handler");

const checkSubscription = (requiredFeature) => {
  return async (req, res, next) => {
    const user = await User.findById(req.user._id).populate(
      "subscription.planId"
    );

    // Trial access check
    if (
      user.subscription.status === "trial" &&
      new Date() < user.trial.expiresAt
    ) {
      return next();
    }

    // Paid subscription check
    if (user.subscription.status !== "active") {
      return res.status(403).json({
        error: "Subscription required",
        message: "Please subscribe to access this feature",
      });
    }

    // Feature gating
    if (
      requiredFeature &&
      !user.subscription.planId?.features[requiredFeature]
    ) {
      return res.status(403).json({
        error: "Upgrade required",
        message: "This feature requires a higher subscription tier",
      });
    }

    next();
  };
};

// Admin Role check
const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (user?.role === "admin") {
      return next();
    }
    res.status(403).json({
      success: false,
      error: "Unauthorized: Admin privileges required",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error verifying admin status",
    });
  }
};

// Middleware to check trial status
const checkTrialStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  // Check if trial has expired
  if (!user.trial.used && new Date() > new Date(user.trial.expiresAt)) {
    await User.findByIdAndUpdate(user._id, {
      "subscription.status": "expired",
    });
    return res.status(403).json({
      success: false,
      error: "Trial period has ended. Please upgrade your account.",
    });
  }

  // Check if already converted to paid
  if (user.trial.used) {
    return res.status(400).json({
      success: false,
      error: "Trial already converted to paid subscription",
    });
  }

  next();
});

module.exports = { checkSubscription, checkAdmin, checkTrialStatus };
