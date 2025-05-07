const asyncHandler = require("express-async-handler");
const Notification = require("../models/NotificationModel");
const AppError = require("../utils/appError");

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res, next) => {
  const { read, type, limit = 20 } = req.query;

  const filter = {
    $or: [
      { recipient: req.user.uid },
      { team: { $in: req.user.teams } }, // Assuming user has teams populated
    ],
  };

  if (read !== undefined) filter.read = read === "true";
  if (type) filter.type = type;

  const notifications = await Notification.find(filter)
    .populate("senderDetails", "name email avatar")
    .populate("teamDetails", "name avatar")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      $or: [{ recipient: req.user.uid }, { team: { $in: req.user.teams } }],
    },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return next(AppError.notFound("Notification not found or access denied"));
  }

  res.status(200).json({
    status: "success",
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    {
      $or: [{ recipient: req.user.uid }, { team: { $in: req.user.teams } }],
      read: false,
    },
    { read: true, readAt: new Date() }
  );

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    $or: [{ recipient: req.user.uid }, { team: { $in: req.user.teams } }],
    read: false,
  });

  res.status(200).json({
    status: "success",
    data: { count },
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    $or: [{ recipient: req.user.uid }, { team: { $in: req.user.teams } }],
  });

  if (!notification) {
    return next(AppError.notFound("Notification not found or access denied"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
