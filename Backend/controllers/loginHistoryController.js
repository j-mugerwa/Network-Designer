// controllers/loginHistoryController.js
const LoginHistory = require("../models/LoginHistoryModel");
const asyncHandler = require("express-async-handler");

// @desc    Get login history for a user
// @route   GET /api/login-history/:userId
// @access  Private (Admin or same user)
const getUserLoginHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const history = await LoginHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    count: history.length,
    data: history,
  });
});

module.exports = {
  getUserLoginHistory,
};
