// routes/optimizationRoutes.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  createOptimization,
  updateOptimization,
  getOptimizationResults,
  getUserOptimizations,
  getOptimization,
  archiveOptimization,
} = require("../controllers/optimizationController");

// Apply authentication middleware to all routes
router.use(verifyFirebaseToken);

// Apply optimization limit check to creation route
router.post("/", createOptimization);
router.get("/", getUserOptimizations);
router.get("/:id", getOptimization);
router.put("/:id", updateOptimization);
router.get("/:id/results", getOptimizationResults);
router.put("/:id/archive", archiveOptimization);

module.exports = router;
