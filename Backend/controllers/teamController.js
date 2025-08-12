const asyncHandler = require("express-async-handler");
const Team = require("../models/TeamModel");
const NetworkDesign = require("../models/NetworkDesignModel");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private

/*
const createTeam = asyncHandler(async (req, res, next) => {
  const { name, description, members } = req.body;

  // Convert uid string to ObjectId
  const createdBy = mongoose.Types.ObjectId(req.user.uid);

  // Create team with creator as owner
  const team = await Team.create({
    name,
    description,
    createdBy,
    members: members
      ? members.map((m) => ({
          userId: mongoose.Types.ObjectId(m.userId), // Convert member IDs too
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
*/

const createTeam = asyncHandler(async (req, res, next) => {
  const { name, description, members } = req.body;

  // Convert uid string to ObjectId - NEW SYNTAX
  const createdBy = new mongoose.Types.ObjectId(req.user.uid);

  // Create team with creator as owner
  const team = await Team.create({
    name,
    description,
    createdBy,
    members: members
      ? members.map((m) => ({
          userId: new mongoose.Types.ObjectId(m.userId), // NEW SYNTAX
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

/*
const getUserTeams = asyncHandler(async (req, res, next) => {
  // Convert uid to ObjectId
  const userId = mongoose.Types.ObjectId(req.user.uid);

  const teams = await Team.find({
    $or: [{ createdBy: userId }, { "members.userId": userId }],
  })
    .populate("owner", "name email avatar")
    .populate("members.userId", "name email avatar")
    .lean(); // Use lean() for better performance

  res.status(200).json({
    status: "success",
    results: teams.length,
    data: teams,
  });
});
*/

const getUserTeams = asyncHandler(async (req, res, next) => {
  try {
    // Convert uid to ObjectId safely
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(req.user.uid);
    } catch (err) {
      return next(new AppError("Invalid user ID format", 400));
    }

    console.log("Fetching teams for user:", req.user.uid); // Debug log

    const teams = await Team.find({
      $or: [{ createdBy: userId }, { "members.userId": userId }],
    })
      .populate("owner", "name email avatar")
      .populate("members.userId", "name email avatar")
      .lean();

    console.log("Found teams:", teams.length); // Debug log

    res.status(200).json({
      status: "success",
      results: teams.length,
      data: teams,
    });
  } catch (err) {
    console.error("Error in getUserTeams:", err);
    next(new AppError("Failed to fetch teams", 500));
  }
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

  const designCount = await NetworkDesign.countDocuments({ teamId: team._id });

  res.status(200).json({
    status: "success",
    data: {
      ...team.toObject(),
      designCount,
    },
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

// @desc    Invite user to team via email
// @route   POST /api/teams/:id/invite
// @access  Private (Team owner/admins only)
const inviteToTeam = asyncHandler(async (req, res, next) => {
  const { email, role } = req.body;
  const teamId = req.params.id;

  // Verify permissions
  const team = await Team.findOne({
    _id: teamId,
    $or: [
      { createdBy: req.user.uid },
      { "members.userId": req.user.uid, "members.role": "admin" },
    ],
  });

  if (!team) {
    return next(AppError.unauthorized("No permission to invite users"));
  }

  // Check if user already exists
  const User = require("../models/UserModel");
  const existingUser = await User.findOne({ email });

  if (
    existingUser &&
    team.members.some((m) => m.userId.equals(existingUser._id))
  ) {
    return next(new AppError("User is already a team member", 400));
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Add invitation
  team.invitations.push({ email, token, role, expiresAt });
  await team.save();

  // Send email
  const inviteUrl = `${process.env.FRONTEND_URL}/teams/accept-invite?token=${token}&team=${teamId}`;

  await sendEmail(
    `Invitation to join ${team.name}`,
    `You've been invited to join ${team.name}. <a href="${inviteUrl}">Click here</a> to accept.`,
    email
  );

  res.status(200).json({
    status: "success",
    message: "Invitation sent",
  });
});

// @desc    Accept team invitation
// @route   POST /api/teams/accept-invite
// @access  Private
const acceptInvite = asyncHandler(async (req, res, next) => {
  const { token, teamId } = req.body;

  const team = await Team.findOne({
    _id: teamId,
    "invitations.token": token,
    "invitations.expiresAt": { $gt: new Date() },
  });

  if (!team) {
    return next(new AppError("Invalid or expired invitation", 400));
  }

  const invitation = team.invitations.find((inv) => inv.token === token);

  // Add user to team
  team.members.push({
    userId: req.user.uid,
    role: invitation.role,
  });

  // Remove invitation
  team.invitations = team.invitations.filter((inv) => inv.token !== token);
  await team.save();

  res.status(200).json({
    status: "success",
    data: team,
  });
});

// @desc    Get all designs for a team
// @route   GET /api/teams/:id/designs
// @access  Private (Team members only)
const getTeamDesigns = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, search } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Verify team membership
  const team = await Team.findOne({
    _id: id,
    $or: [{ createdBy: req.user.uid }, { "members.userId": req.user.uid }],
  }).populate("owner", "name email");

  if (!team) {
    return next(AppError.unauthorized("Not a member of this team"));
  }

  // Build query
  const query = {
    teamId: id,
    ...(status && { designStatus: status }),
    ...(search && {
      $or: [
        { designName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const [designs, total] = await Promise.all([
    NetworkDesign.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .lean(),
    NetworkDesign.countDocuments(query),
  ]);

  // Add permission flags
  const enhancedDesigns = designs.map((design) => ({
    ...design,
    permissions: {
      canEdit:
        team.createdBy.equals(req.user.uid) ||
        team.members.some(
          (m) =>
            m.userId.equals(req.user.uid) && ["owner", "admin"].includes(m.role)
        ),
      canDelete: team.createdBy.equals(req.user.uid),
    },
  }));

  res.status(200).json({
    status: "success",
    data: {
      team: {
        id: team._id,
        name: team.name,
        owner: team.owner,
      },
      designs: enhancedDesigns,
      count: enhancedDesigns.length,
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
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
  inviteToTeam,
  acceptInvite,
  removeTeamMember,
  getTeamDesigns,
};
