const express = require("express");
const router = express.Router();
const {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  cloneTemplate,
} = require("../controllers/reportTemplateController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

router.use(verifyFirebaseToken);
// Public routes
router.get("/", getTemplates);
router.get("/:id", getTemplate);

// Admin routes
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.patch("/:id/status", toggleTemplateStatus);
router.delete("/:id", deleteTemplate);

// User routes
router.post("/:id/clone", cloneTemplate);

module.exports = router;
