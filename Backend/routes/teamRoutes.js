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
  getTeamDesigns,
} = require("../controllers/teamController");

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 invite requests per window
});

router.use(verifyFirebaseToken);

router.post("/", createTeam);
router.get("/", getUserTeams);
router.get("/:id", getTeam);
router.put("/:id", updateTeam);

router.post("/:id/members", addTeamMember);
router.delete("/:id/members/:memberId", removeTeamMember);

router.post("/:id/invite", inviteLimiter, inviteToTeam);
router.post("/accept-invite", acceptInvite);

// New route for team designs
router.get("/:id/designs", getTeamDesigns);

module.exports = router;
