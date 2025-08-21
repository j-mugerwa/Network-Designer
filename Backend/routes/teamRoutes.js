// routes/teamRoutes.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  createTeam,
  getUserTeams,
  getTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  inviteToTeam,
  acceptInvite,
  declineInvite,
  getTeamDesigns,
  getSentInvitations,
  deleteInvitation,
  resendInvitation,
  getMembersFromOwnedTeams,
} = require("../controllers/teamController");

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 invite requests per window
});

router.use(verifyFirebaseToken);

router.post("/", createTeam);
router.get("/", getUserTeams);
router.get("/members", getMembersFromOwnedTeams);
router.get("/:id", getTeam);
router.put("/:id", updateTeam);

router.post("/:id/members", addTeamMember);
router.delete("/:id/members/:memberId", removeTeamMember);

router.post("/:id/invite", inviteLimiter, inviteToTeam);
router.post("/accept-invite", acceptInvite);
router.post("/decline-invite", declineInvite);

// New route for team designs
router.get("/:id/designs", getTeamDesigns);
// Invitations Related.
router.get("/invitations/sent", getSentInvitations);
router.delete("/invitations/:id", deleteInvitation);
router.post("/invitations/:id/resend", resendInvitation);

module.exports = router;
