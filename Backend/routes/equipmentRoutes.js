const express = require("express");
const router = express.Router();
const {
  createEquipment,
  createSystemEquipment,
  getAllEquipment,
  getUserEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentRecommendations,
  getEquipmentByCategory,
  getSimilarEquipment,
} = require("../controllers/equipmentController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const { checkRole } = require("../middlewares/roleMiddleware");
const { upload } = require("../utils/fileUpload");

// ========== Public Routes ==========
router.get("/", getAllEquipment);
router.get("/category/:category", getEquipmentByCategory);
router.get("/similar/:id", getSimilarEquipment);

// ========== Authenticated User Routes ==========
router.get("/user/", verifyFirebaseToken, getUserEquipment);
router.get(
  "/recommendations/:designId",
  verifyFirebaseToken,
  getEquipmentRecommendations
);

// ========== Equipment CRUD Routes ==========
// Create
router.post("/", verifyFirebaseToken, upload.single("image"), createEquipment);
router.post(
  "/system",
  verifyFirebaseToken,
  checkRole("admin"),
  upload.single("image"),
  createSystemEquipment
);

// Read (must come after more specific routes)
router.get("/:id", getEquipment);

// Update & Delete
router.put(
  "/:id",
  verifyFirebaseToken,
  upload.single("image"),
  updateEquipment
);
router.delete("/:id", verifyFirebaseToken, deleteEquipment);

module.exports = router;
