const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const { upload, cleanupUploads } = require("../utils/fileUpload");
const {
  createTemplate,
  getTemplates,
  getTemplate,
  getUserTemplates,
  getAllTemplatesAdmin,
  updateTemplate,
  deployConfiguration,
  getDeviceDeploymentHistory,
  downloadConfigFile,
  getCompatibleTemplates,
  updateDeploymentStatus,
} = require("../controllers/configurationController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Template management routes
router.post("/", upload.single("configFile"), cleanupUploads, createTemplate);
router.get("/", getTemplates); // Regular user templates (filters by creator)
router.get("/user", getUserTemplates); // User-specific templates
router.get("/admin/all", getAllTemplatesAdmin); // Admin-only all templates
router.get("/:id", getTemplate);
router.put("/:id", upload.single("configFile"), cleanupUploads, updateTemplate);

// Configuration deployment routes
router.post(
  "/:id/deploy",
  upload.single("configFile"),
  cleanupUploads,
  deployConfiguration
);

router.get("/:id/file", downloadConfigFile);
router.patch("/:templateId/deployments/:deploymentId", updateDeploymentStatus);

// Device-specific configuration routes
router.get("/devices/:deviceId/compatible-templates", getCompatibleTemplates);
router.get("/devices/:deviceId/config-deployments", getDeviceDeploymentHistory);

module.exports = router;
