// controllers/dashboardController.js
const Design = require("../models/NetworkDesignModel");
const Team = require("../models/TeamModel");
const Invitation = require("../models/InvitationModel");
const LoginHistory = require("../models/LoginHistoryModel");
const Report = require("../models/ReportModel");
const Notification = require("../models/NotificationModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const NetworkTopology = require("../models/NetworkTopologyModel");

// @desc    Get dashboard statistics and activity
// @route   GET /api/dashboard
// @access  Private

const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userFid = req.user.uid;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Convert userId to ObjectId once
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Fetch all stats in parallel
    const [
      designsCount,
      optimizedDesignsCount,
      visualizedDesignsCount,
      teamsCount,
      invitations,
      recentDesigns,
      recentReports,
      recentNotifications,
      activityData,
    ] = await Promise.all([
      // Basic counts
      Design.countDocuments({ userId: userIdObj }),
      Design.countDocuments({ userId: userIdObj, optimized: true }),
      //Design.countDocuments({ userId: userIdObj, visualized: true }),
      NetworkTopology.countDocuments({ userId: userIdObj }),
      Team.countDocuments({
        createdBy: userFid,
      }),

      // Invitations breakdown
      Invitation.aggregate([
        { $match: { inviterId: userFid } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Recent items (last 5) - updated field selection
      Design.find({ userId: userIdObj })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("designName createdAt")
        .lean(),

      Report.find({ userId: userIdObj })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt")
        .lean(),

      Notification.find({ recipient: userIdObj })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt")
        .lean(),

      // Activity data for chart
      generateActivityData(userIdObj),
    ]);

    // Transform invitations data
    const invitationStats = {
      total: 0,
      accepted: 0,
      pending: 0,
      declined: 0,
    };

    invitations.forEach(({ _id, count }) => {
      invitationStats.total += count;
      invitationStats[_id] = count;
    });

    // Normalize recent items with displayName
    const normalizedRecentItems = {
      designs: recentDesigns.map((design) => ({
        ...design,
        displayName: design.designName,
        id: design._id.toString(),
      })),
      reports: recentReports.map((report) => ({
        ...report,
        displayName: report.title,
        id: report._id.toString(),
      })),
      notifications: recentNotifications.map((notification) => ({
        ...notification,
        displayName: notification.title,
        id: notification._id.toString(),
      })),
    };

    res.json({
      success: true,
      data: {
        stats: {
          designsCreated: designsCount,
          designsOptimized: optimizedDesignsCount,
          designsVisualized: visualizedDesignsCount,
          teamsCreated: teamsCount,
          individualsInvited: invitationStats.total,
          invitationsAccepted: invitationStats.accepted,
          invitationsPending: invitationStats.pending,
          invitationsDeclined: invitationStats.declined,
        },
        recentItems: normalizedRecentItems,
        activityData,
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get user activity data for charts
// @route   GET /api/dashboard/activity
// @access  Private
const getActivityData = asyncHandler(async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id); // Create ObjectId here
    const data = await generateActivityData(userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Activity data fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity data",
    });
  }
});

// Helper function to generate activity data
async function generateActivityData(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [signIns, designs] = await Promise.all([
    LoginHistory.aggregate([
      {
        $match: {
          userId: userId, // Already an ObjectId
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Design.aggregate([
      {
        $match: {
          userId: userId, // Already an ObjectId
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Generate complete 30-day timeline
  const labels = [];
  const signInData = [];
  const designData = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];

    labels.push(
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date)
    );

    // Find matching data or use 0
    signInData.push(signIns.find((d) => d._id === dateStr)?.count || 0);
    designData.push(designs.find((d) => d._id === dateStr)?.count || 0);
  }

  return {
    labels,
    signIns: signInData,
    designsCreated: designData,
  };
}

module.exports = {
  getDashboardData,
  getActivityData,
};
