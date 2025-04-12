const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  getConfigurations,
  getConfiguration,
  applyConfiguration,
  downloadConfiguration,
  regenerateConfiguration,
  deleteConfiguration,
} = require("../controllers/generatedConfigController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Base routes
router.get("/", getConfigurations);

router.get("/:id", getConfiguration);
router.delete("/:id", deleteConfiguration);

// Action routes
router.patch("/:id/apply", applyConfiguration);

router.get("/:id/download", downloadConfiguration);

router.post("/:id/regenerate", regenerateConfiguration);

module.exports = router;
