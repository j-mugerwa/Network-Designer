const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const DesignShare = require("../models/DesignShareModel");
const Comment = require("../models/CommentsModel");
const Team = require("../models/TeamModel");
const Notification = require("../models/NotificationModel");
const AppError = require("../utils/appError");

// Utility function to check design access
const checkDesignAccess = async (designId, userId) => {
  const design = await NetworkDesign.findOne({
    _id: designId,
    $or: [{ userId }, { sharedWith: userId }],
  });
  return !!design;
};

// @desc    Share a design with user or team
// @route   POST /api/collaboration/share
// @access  Private
const shareDesign = asyncHandler(async (req, res, next) => {
  const { designId, sharedWithId, sharedWithType, permission, expiresAt } =
    req.body;

  // Validate share type
  if (!["User", "Team"].includes(sharedWithType)) {
    return next(
      new AppError('Invalid share type. Must be "User" or "Team"', 400)
    );
  }

  // Verify user owns the design
  const design = await NetworkDesign.findOne({
    _id: designId,
    userId: req.user.uid,
  });

  if (!design) {
    return next(AppError.unauthorized("You can only share designs you own"));
  }

  // Check if share already exists
  const existingShare = await DesignShare.findOne({
    designId,
    sharedWith: sharedWithId,
    sharedWithModel: sharedWithType,
  });

  if (existingShare) {
    return next(
      new AppError("This design is already shared with this recipient", 400)
    );
  }

  // Create share record
  const share = await DesignShare.create({
    designId,
    sharedBy: req.user.uid,
    sharedWith: sharedWithId,
    sharedWithModel: sharedWithType,
    permission,
    expiresAt,
  });

  // Create notification
  await Notification.create({
    recipient: sharedWithType === "User" ? sharedWithId : null,
    team: sharedWithType === "Team" ? sharedWithId : null,
    sender: req.user.uid,
    type: "design_shared",
    metadata: {
      designId,
      designName: design.designName,
      permission,
    },
  });

  res.status(201).json({
    status: "success",
    data: share,
  });
});

// @desc    Get all shares for a design
// @route   GET /api/collaboration/shares/:designId
// @access  Private (Design owner only)
const getDesignShares = asyncHandler(async (req, res, next) => {
  const { designId } = req.params;

  // Verify user owns the design
  const design = await NetworkDesign.findOne({
    _id: designId,
    userId: req.user.uid,
  });

  if (!design) {
    return next(AppError.unauthorized("Only design owner can view shares"));
  }

  const shares = await DesignShare.find({ designId })
    .populate({
      path: "sharedWith",
      select: "name email avatar",
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: shares.length,
    data: shares,
  });
});

// @desc    Revoke a design share
// @route   DELETE /api/collaboration/shares/:shareId
// @access  Private (Design owner only)
const revokeShare = asyncHandler(async (req, res, next) => {
  const share = await DesignShare.findOneAndDelete({
    _id: req.params.shareId,
    sharedBy: req.user.uid,
  });

  if (!share) {
    return next(AppError.notFound("Share not found or access denied"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Add a comment to a design
// @route   POST /api/collaboration/comments
// @access  Private (Requires view access)
const addComment = asyncHandler(async (req, res, next) => {
  const { designId, content, taggedUsers } = req.body;

  // Verify user has access to the design
  const hasAccess = await checkDesignAccess(designId, req.user.uid);
  if (!hasAccess) {
    return next(AppError.unauthorized("No access to this design"));
  }

  const comment = await Comment.create({
    designId,
    userId: req.user.uid,
    content,
    taggedUsers,
  });

  // Populate user details for response
  await comment.populate("user", "name email avatar");

  // Create notifications for tagged users
  if (taggedUsers && taggedUsers.length > 0) {
    const notifications = taggedUsers.map((userId) => ({
      recipient: userId,
      sender: req.user.uid,
      type: "comment_tag",
      metadata: {
        designId,
        commentId: comment._id,
      },
    }));

    await Notification.insertMany(notifications);
  }

  res.status(201).json({
    status: "success",
    data: comment,
  });
});

// @desc    Get all comments for a design
// @route   GET /api/collaboration/comments/:designId
// @access  Private (Requires view access)
const getDesignComments = asyncHandler(async (req, res, next) => {
  const { designId } = req.params;

  // Verify user has access to the design
  const hasAccess = await checkDesignAccess(designId, req.user.uid);
  if (!hasAccess) {
    return next(AppError.unauthorized("No access to this design"));
  }

  const comments = await Comment.find({ designId })
    .populate("user", "name email avatar")
    .populate({
      path: "replies.userId",
      select: "name email avatar",
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: comments.length,
    data: comments,
  });
});

// @desc    Reply to a comment
// @route   POST /api/collaboration/comments/:commentId/reply
// @access  Private (Requires view access)
const replyToComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // Get parent comment to verify design access
  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    return next(AppError.notFound("Comment not found"));
  }

  // Verify user has access to the design
  const hasAccess = await checkDesignAccess(
    parentComment.designId,
    req.user.uid
  );
  if (!hasAccess) {
    return next(AppError.unauthorized("No access to this design"));
  }

  const reply = {
    userId: req.user.uid,
    content,
  };

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $push: { replies: reply } },
    { new: true }
  ).populate({
    path: "replies.userId",
    select: "name email avatar",
  });

  // Create notification for comment author
  await Notification.create({
    recipient: parentComment.userId,
    sender: req.user.uid,
    type: "comment_reply",
    metadata: {
      designId: parentComment.designId,
      commentId: parentComment._id,
    },
  });

  res.status(201).json({
    status: "success",
    data: updatedComment.replies[updatedComment.replies.length - 1],
  });
});

// @desc    Like/unlike a comment
// @route   PATCH /api/collaboration/comments/:commentId/like
// @access  Private (Requires view access)
const toggleCommentLike = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  // Get comment to verify design access
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(AppError.notFound("Comment not found"));
  }

  // Verify user has access to the design
  const hasAccess = await checkDesignAccess(comment.designId, req.user.uid);
  if (!hasAccess) {
    return next(AppError.unauthorized("No access to this design"));
  }

  const userId = req.user.uid;
  const isLiked = comment.likes.includes(userId);

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
    { new: true }
  );

  // Create notification if liking (not when unliking)
  if (!isLiked && comment.userId.toString() !== userId) {
    await Notification.create({
      recipient: comment.userId,
      sender: userId,
      type: "comment_like",
      metadata: {
        designId: comment.designId,
        commentId: comment._id,
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: updatedComment,
  });
});

module.exports = {
  shareDesign,
  getDesignShares,
  revokeShare,
  addComment,
  getDesignComments,
  replyToComment,
  toggleCommentLike,
};
