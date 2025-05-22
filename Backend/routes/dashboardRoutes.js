// routes/dashboardRoutes.js
const express = require("express");
const {
  getActivityData,
  getDashboardData,
} = require("../controllers/dashboardController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

const router = express.Router();

// @desc    Get dashboard statistics and activity
// @route   GET /api/dashboard
// @access  Private
router.get("/", verifyFirebaseToken, getDashboardData);

// @desc    Get user activity data for charts
// @route   GET /api/dashboard/activity
// @access  Private
router.get("/activity", verifyFirebaseToken, getActivityData);

module.exports = router;
