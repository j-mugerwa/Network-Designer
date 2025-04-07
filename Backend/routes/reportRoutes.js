// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
//const { protect } = require("../middleware/authMiddleware");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  generateFullReport,
  generateProfessionalReport,
  generateFromTemplate,
  getDesignReports,
  getReport,
} = require("../controllers/reportController");

router.use(verifyFirebaseToken);

router.post("/full/:designId", generateFullReport);
router.post("/prof/:designId", generateProfessionalReport);
router.post("/template", generateFromTemplate);
router.get("/design/:designId", getDesignReports);
router.get("/:reportId", getReport);

module.exports = router;
