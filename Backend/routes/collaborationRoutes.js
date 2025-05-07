const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  shareDesign,
  getDesignShares,
  revokeShare,
  addComment,
  getDesignComments,
  replyToComment,
  toggleCommentLike,
} = require("../controllers/collaborationController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Sharing routes
router.route("/share").post(shareDesign);

router.route("/shares/:designId").get(getDesignShares);

router.route("/shares/:shareId").delete(revokeShare);

// Comment routes
router.route("/comments").post(addComment);

router.route("/comments/:designId").get(getDesignComments);

router.route("/comments/:commentId/reply").post(replyToComment);

router.route("/comments/:commentId/like").patch(toggleCommentLike);

module.exports = router;
