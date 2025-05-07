const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require("../controllers/notificationController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

router.route("/").get(getNotifications);

router.route("/unread-count").get(getUnreadCount);

router.route("/mark-all-read").patch(markAllAsRead);

router.route("/:id/read").patch(markAsRead);

router.route("/:id").delete(deleteNotification);

module.exports = router;
