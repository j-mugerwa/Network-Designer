const asyncHandler = require("express-async-handler");
const Team = require("../models/TeamModel");
const AppError = require("../utils/appError");

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res, next) => {
  const { name, description, members } = req.body;

  // Create team with creator as owner
  const team = await Team.create({
    name,
    description,
    createdBy: req.user.uid,
    members: members
      ? members.map((m) => ({
          userId: m.userId,
          role: m.role || "member",
        }))
      : [],
  });

  // Populate owner details
  await team.populate("owner", "name email avatar");

  res.status(201).json({
    status: "success",
    data: team,
  });
});

// @desc    Get all teams for user
// @route   GET /api/teams
// @access  Private
const getUserTeams = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({
    $or: [{ createdBy: req.user.uid }, { "members.userId": req.user.uid }],
  })
    .populate("owner", "name email avatar")
    .populate("members.userId", "name email avatar");

  res.status(200).json({
    status: "success",
    results: teams.length,
    data: teams,
  });
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private (Team members only)
const getTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    $or: [{ createdBy: req.user.uid }, { "members.userId": req.user.uid }],
  })
    .populate("owner", "name email avatar")
    .populate("members.userId", "name email avatar");

  if (!team) {
    return next(AppError.notFound("Team not found or access denied"));
  }

  res.status(200).json({
    status: "success",
    data: team,
  });
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team owner/admins only)
const updateTeam = asyncHandler(async (req, res, next) => {
  const { name, description, avatar } = req.body;

  // Verify user is owner or admin
  const team = await Team.findOne({
    _id: req.params.id,
    $or: [
      { createdBy: req.user.uid },
      { "members.userId": req.user.uid, "members.role": "admin" },
    ],
  });

  if (!team) {
    return next(
      AppError.unauthorized("Only owners/admins can update the team")
    );
  }

  team.name = name || team.name;
  team.description = description || team.description;
  team.avatar = avatar || team.avatar;
  await team.save();

  res.status(200).json({
    status: "success",
    data: team,
  });
});

// @desc    Add team member
// @route   POST /api/teams/:id/members
// @access  Private (Team owner/admins only)
const addTeamMember = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;

  // Verify user is owner or admin
  const team = await Team.findOne({
    _id: req.params.id,
    $or: [
      { createdBy: req.user.uid },
      { "members.userId": req.user.uid, "members.role": "admin" },
    ],
  });

  if (!team) {
    return next(AppError.unauthorized("Only owners/admins can add members"));
  }

  // Check if user is already a member
  const isMember = team.members.some((m) => m.userId.toString() === userId);
  if (isMember) {
    return next(new AppError("User is already a team member", 400));
  }

  team.members.push({ userId, role: role || "member" });
  await team.save();

  res.status(200).json({
    status: "success",
    data: team,
  });
});

// @desc    Remove team member
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Team owner/admins only)
const removeTeamMember = asyncHandler(async (req, res, next) => {
  const { id, memberId } = req.params;

  // Verify user is owner or admin
  const team = await Team.findOne({
    _id: id,
    $or: [
      { createdBy: req.user.uid },
      { "members.userId": req.user.uid, "members.role": "admin" },
    ],
  });

  if (!team) {
    return next(AppError.unauthorized("Only owners/admins can remove members"));
  }

  // Can't remove yourself if you're the owner
  if (memberId === req.user.uid && team.createdBy.toString() === req.user.uid) {
    return next(new AppError("Owners cannot remove themselves", 400));
  }

  team.members = team.members.filter((m) => m.userId.toString() !== memberId);
  await team.save();

  res.status(200).json({
    status: "success",
    data: team,
  });
});

module.exports = {
  createTeam,
  getUserTeams,
  getTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
};
