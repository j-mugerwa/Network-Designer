const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
//const checkRole = require("../middlewares/roleMiddleware");
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  generateDeviceConfig,
  getGeneratedConfigs,
} = require("../controllers/configurationController");

// Apply authentication to all routes
router.use(verifyFirebaseToken);

// Template management routes
router.post("/", createTemplate);
router.get("/", getTemplates);

router.get("/:id", getTemplate);
router.put("/:id", updateTemplate);

// Configuration generation routes
router.post("/generate", generateDeviceConfig);

router.get("/generated", getGeneratedConfigs);

module.exports = router;
