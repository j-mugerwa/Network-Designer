// routes/designRoutes.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
//const { protect } = require("../middleware/authMiddleware");
const { checkDesignLimit } = require("../middlewares/designMiddleware");
const {
  createDesign,
  updateDesign,
  generateReport,
  getUserDesigns,
  getTeamDesigns,
  assignDesignToTeam,
  removeDesignFromTeam,
  getDesign,
  archiveDesign,
} = require("../controllers/networkDesignController");

// Apply protect middleware to all routes
router.use(verifyFirebaseToken);

// Apply design limit check to creation route
router.post("/", checkDesignLimit, createDesign);
router.get("/", getUserDesigns);
router.get("/:id", getDesign);
router.get("/:teamId", getTeamDesigns);
router.put("/:id/assign-to-team", assignDesignToTeam);
router.put("/:id/remove-from-team", removeDesignFromTeam);
router.put("/:id", updateDesign);
router.post("/:id/report", generateReport);
router.put("/:id/archive", archiveDesign);

module.exports = router;
