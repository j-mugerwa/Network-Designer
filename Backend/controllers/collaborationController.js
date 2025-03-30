const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const DesignShare = require("../models/DesignShareModel");
const Comment = require("../models/CommentsModel");

//Create a share design
const shareDesign = asyncHandler(async (req, res) => {
  try {
    const { designId, sharedWith, permission } = req.body;

    // Verify user has permission to share this design
    const design = await NetworkDesign.findOne({
      _id: designId,
      userId: req.user._id,
    });

    if (!design) {
      return res
        .status(403)
        .json({ success: false, error: "Permission denied" });
    }

    const share = new DesignShare({
      designId,
      sharedBy: req.user._id,
      sharedWith,
      permission,
    });

    await share.save();

    res.json({ success: true, data: share });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const addComment = asyncHandler(async (req, res) => {
  try {
    const { designId, content } = req.body;

    // Verify user has access to this design
    const hasAccess = await checkDesignAccess(designId, req.user._id);

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const comment = new Comment({
      designId,
      userId: req.user._id,
      content,
    });

    await comment.save();

    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  shareDesign,
  addComment,
};
