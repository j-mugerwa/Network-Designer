// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  generateProfessionalReport,
  downloadReport,
  generateFromTemplate,
  getDesignReports,
  getUserReports,
  getReport,
} = require("../controllers/reportController");

router.use(verifyFirebaseToken);

// Reordered routes
router.get("/", getUserReports);
router.post("/prof/:designId", generateProfessionalReport);
router.post("/template", generateFromTemplate);
router.get("/design/:designId", getDesignReports);
router.get("/download/:reportId", downloadReport);
router.get("/:reportId", getReport);

module.exports = router;
