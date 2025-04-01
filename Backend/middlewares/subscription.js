// middlewares/subscription.js
const User = require("../models/UserModel");
const checkSubscription = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate(
        "subscription.planId"
      );
      // Check trial period first
      if (
        user.trial.used === false ||
        new Date(user.trial.expiresAt) > new Date()
      ) {
        return next();
      }
      // Check subscription status
      if (user.subscription.status !== "active") {
        return res.status(403).json({
          error: "Subscription inactive",
          message: "Please renew your subscription to access this feature",
        });
      }
      // Check specific feature access
      if (
        requiredFeature &&
        !user.subscription.planId.features[requiredFeature]
      ) {
        return res.status(403).json({
          error: "Feature not available",
          message: "Upgrade your plan to access this feature",
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};
module.exports = { checkSubscription };
