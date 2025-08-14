const asyncHandler = require("express-async-handler");
const Team = require("../models/TeamModel");
const Invitation = require("../models/InvitationModel");
const User = require("../models/UserModel");
const NetworkDesign = require("../models/NetworkDesignModel");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const admin = require("../config/firebse");
const mongoose = require("mongoose");

// @desc    Create a new team
// @route   POST /api/team
// @access  Private

const createTeam = asyncHandler(async (req, res, next) => {
  const { name, description, members } = req.body;

  //Limit To 10 teams.
  const MAX_TEAMS_PER_USER = 10;
  const userTeamsCount = await Team.countDocuments({ createdBy: req.user.uid });
  if (userTeamsCount >= MAX_TEAMS_PER_USER) {
    return next(
      new AppError(`Maximum of ${MAX_TEAMS_PER_USER} teams allowed`, 400)
    );
  }

  const team = await Team.create({
    name,
    description,
    createdBy: req.user.uid,
    members: members || [], // Members can be added later
  });

  // The pre-save hook will automatically add creator as owner
  await team.populate({
    path: "owner",
    match: { firebaseUID: req.user.uid },
    select: "name email avatar",
  });

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
    .populate({
      path: "owner",
      match: { firebaseUID: req.user.uid },
      select: "name email avatar",
    })
    .lean();

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

  // Verify permissions and get team
  const team = await Team.findOne({
    _id: teamId,
    $or: [
      { createdBy: req.user.uid },
      { "members.userId": req.user.uid, "members.role": "admin" },
    ],
  }).populate("owner", "company");

  if (!team) {
    return next(AppError.unauthorized("No permission to invite users"));
  }

  // Check if invitation already exists and is pending
  const existingInvite = await Invitation.findOne({
    email: email.toLowerCase(),
    team: teamId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (existingInvite) {
    return next(
      new AppError("Pending invitation already exists for this user", 400)
    );
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create invitation record
  const invitation = await Invitation.create({
    email: email.toLowerCase(),
    token,
    role: role || "member",
    company: team.owner.company, // Inherit company from team owner
    inviterId: req.user.uid,
    team: teamId,
    expiresAt,
  });

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  const isNewUser = !existingUser;

  // Send appropriate email
  const inviteUrl = `${process.env.FRONTEND_URL}/team/accept-invite?token=${token}`;

  if (isNewUser) {
    await sendEmail(
      `Invitation to join ${team.owner.company} on Network Designer`,
      `You've been invited to join ${team.owner.company}'s team on Network Designer.
      <a href="${inviteUrl}">Click here</a> to create your account and join.`,
      email
    );
  } else {
    await sendEmail(
      `Invitation to join ${team.name}`,
      `You've been invited to join ${team.name}.
      <a href="${inviteUrl}">Click here</a> to accept the invitation.`,
      email
    );
  }

  res.status(200).json({
    status: "success",
    message: "Invitation sent",
    isNewUser, // Frontend can use this for messaging if needed
  });
});

// @desc    Accept team invitation
// @route   POST /api/teams/accept-invite
// @access  Private

const acceptInvite = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  // Verify token
  const invitation = await Invitation.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).populate("team");

  if (!invitation) {
    return next(new AppError("Invalid or expired invitation", 400));
  }

  // Check if user exists
  let user = await User.findOne({ email: invitation.email });

  if (!user) {
    // New user registration flow
    if (!password) {
      return res.status(200).json({
        status: "registration_required",
        message: "Registration required",
        requiresRegistration: true,
        email: invitation.email,
        company: invitation.company,
      });
    }

    // Create new user
    user = await User.create({
      email: invitation.email,
      company: invitation.company,
      // Other registration fields as needed
      firebaseUID: (
        await admin.auth().createUser({
          email: invitation.email,
          password,
          emailVerified: true,
        })
      ).uid,
    });

    // Update invitation with new user ID
    invitation.registeredUserId = user._id;
  }

  // Add user to team
  const team = await Team.findById(invitation.team._id);
  team.members.push({
    userId: user._id,
    role: invitation.role,
  });
  await team.save();

  // Update invitation status
  invitation.status = "accepted";
  await invitation.save();

  // Generate auth token for immediate login
  const authToken = await admin.auth().createCustomToken(user.firebaseUID);

  res.status(200).json({
    status: "success",
    data: {
      team: team._id,
      authToken,
    },
  });
});

//Get invitations sent by the currently logged in user.
const getSentInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({
    inviterId: req.user.uid,
  })
    .populate("team", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    status: "success",
    data: invitations.map((inv) => ({
      id: inv._id,
      email: inv.email,
      team: {
        id: inv.team._id,
        name: inv.team.name,
      },
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    })),
  });
});

//Delete an invitation
const deleteInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findOneAndDelete({
    _id: req.params.id,
    inviterId: req.user.uid,
  });

  if (!invitation) {
    return next(new AppError("Invitation not found or access denied", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

//Resend invitation:
const resendInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findOne({
    _id: req.params.id,
    inviterId: req.user.uid,
  }).populate("team", "name owner");

  if (!invitation) {
    return next(new AppError("Invitation not found or access denied", 404));
  }

  // Generate new token and expiration
  invitation.token = crypto.randomBytes(32).toString("hex");
  invitation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await invitation.save();

  // Send email
  const inviteUrl = `${process.env.FRONTEND_URL}/team/accept-invite?token=${invitation.token}`;
  await sendEmail(
    `New invitation to join ${invitation.team.name}`,
    `You've been invited to join ${invitation.team.name}.
    <a href="${inviteUrl}">Click here</a> to accept the invitation.`,
    invitation.email
  );

  res.status(200).json({
    status: "success",
    data: {
      id: invitation._id,
      email: invitation.email,
      team: {
        id: invitation.team._id,
        name: invitation.team.name,
      },
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    },
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
  getSentInvitations,
  deleteInvitation,
  resendInvitation,
  removeTeamMember,
  getTeamDesigns,
};
