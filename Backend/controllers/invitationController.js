// controllers/invitationController.js
const Invitation = require("../models/InvitationModel");
const Team = require("../models/TeamModel");
const User = require("../models/UserModel");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

// @desc    Create new invitation
// @route   POST /api/invitations
// @access  Private
const createInvitation = asyncHandler(async (req, res) => {
  const { email, teamId, role } = req.body;

  // Validate team exists and user is owner
  const team = await Team.findById(teamId);
  if (!team || team.owner.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error("Invalid team or not authorized");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Check if user is already in team
    if (team.members.includes(existingUser._id)) {
      res.status(400);
      throw new Error("User is already a team member");
    }
  }

  // Check for existing invitation
  const existingInvitation = await Invitation.findOne({ email, team: teamId });
  if (existingInvitation) {
    res.status(400);
    throw new Error("Invitation already sent to this email");
  }

  // Create invitation token
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const invitation = await Invitation.create({
    email,
    invitedBy: req.user._id,
    team: teamId,
    role,
    token,
    expiresAt,
  });

  // Send invitation email
  const invitationUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

  await sendEmail({
    subject: `Invitation to join team ${team.name}`,
    html: `You've been invited to join ${team.name}. <a href="${invitationUrl}">Click here</a> to accept.`,
    to: email,
  });

  res.status(201).json({
    success: true,
    data: invitation,
  });
});

// @desc    Get user's invitations
// @route   GET /api/invitations
// @access  Private
const getInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({ invitedBy: req.user._id })
    .populate("team", "name")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: invitations,
  });
});

// @desc    Accept invitation
// @route   POST /api/invitations/accept
// @access  Public
const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const invitation = await Invitation.findOne({ token })
    .populate("team", "name members")
    .populate("invitedBy", "name email");

  if (!invitation || invitation.status !== "pending") {
    res.status(400);
    throw new Error("Invalid or expired invitation");
  }

  if (new Date() > invitation.expiresAt) {
    invitation.status = "expired";
    await invitation.save();
    res.status(400);
    throw new Error("Invitation has expired");
  }

  // Add user to team
  const team = invitation.team;
  team.members.push(req.user._id);
  await team.save();

  // Update invitation status
  invitation.status = "accepted";
  await invitation.save();

  res.json({
    success: true,
    data: {
      teamId: team._id,
      teamName: team.name,
      inviter: invitation.invitedBy.name,
    },
  });
});

module.exports = {
  createInvitation,
  getInvitations,
  acceptInvitation,
};
