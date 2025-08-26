// middlewares/designPermissions.js
const Team = require("../models/TeamModel");
const AppError = require("../utils/appError");

const checkDesignAccess = asyncHandler(async (req, res, next) => {
  const designId = req.params.designId || req.body.designId;

  const team = await Team.findOne({
    designs: designId,
    "members.userId": req.user.uid,
  });

  if (!team) {
    return next(AppError.unauthorized("No access to this design"));
  }

  // Attach team info for later use
  req.team = team;
  next();
});

module.exports = checkDesignAccess;
