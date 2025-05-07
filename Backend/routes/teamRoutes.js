const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  createTeam,
  getUserTeams,
  getTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} = require("../controllers/teamController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

router.route("/").post(createTeam).get(getUserTeams);

router.route("/:id").get(getTeam).put(updateTeam);

router.route("/:id/members").post(addTeamMember);

router.route("/:id/members/:memberId").delete(removeTeamMember);

module.exports = router;
