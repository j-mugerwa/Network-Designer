const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  createVersion,
  getVersions,
  getVersion,
  compareVersions,
  publishVersion,
  restoreVersion,
} = require("../controllers/versionController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Design-specific version routes
router.post("/designs/:designId/versions", createVersion);
router.get("/designs/:designId/versions", getVersions);

// Version-specific routes
router.get("/versions/:id", getVersion);

router.patch("/versions/:id/publish", publishVersion);

router.post("/versions/:id/restore", restoreVersion);

// Comparison route
router.get("/versions/compare", compareVersions);

module.exports = router;
