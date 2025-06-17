// Backend/routes/visualizationRoutes.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  generateTopology,
  getTopology,
  renderTopology,
} = require("../controllers/visualizationController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Design-specific topology routes
router.post("/:designId", generateTopology);
router.get("/:designId", getTopology);

// Fix the visualization route to match controller
router.get("/visualization/:topologyId", renderTopology);
module.exports = router;
