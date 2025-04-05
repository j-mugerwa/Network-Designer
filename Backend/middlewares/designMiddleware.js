//designMiddleware.js
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const NetworkDesign = require("../models/NetworkDesignModel");
//const SubscriptionPlan = require("../models/SubscriptionPlanModel");

const checkDesignLimit = asyncHandler(async (req, res, next) => {
  try {
    // Get user with subscription plan details
    const user = await User.findById(req.user._id).populate(
      "subscription.planId"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get current design count
    const designCount = await NetworkDesign.countDocuments({
      userId: user._id,
      designStatus: { $ne: "archived" }, // Don't count archived designs
    });

    // Get plan limits
    const plan = user.subscription.planId;
    if (!plan) {
      return res.status(403).json({
        success: false,
        error: "No active subscription plan found",
      });
    }

    // Check if user can create more designs
    if (designCount >= plan.maxDesigns) {
      return res.status(403).json({
        success: false,
        error: `You've reached your design limit of ${plan.maxDesigns}. Please upgrade your plan.`,
        limit: plan.maxDesigns,
        current: designCount,
      });
    }

    // Attach design count info to request for use in controllers
    req.designLimitInfo = {
      current: designCount,
      limit: plan.maxDesigns,
      remaining: plan.maxDesigns - designCount,
    };

    next();
  } catch (error) {
    console.error("Design limit check error:", error);
    res.status(500).json({
      success: false,
      error: "Error checking design limits",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = { checkDesignLimit };
