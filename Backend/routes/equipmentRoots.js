const express = require("express");
const router = express.Router();
const {
  createEquipment,
  getAllEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentRecommendations,
  getEquipmentByCategory,
  getSimilarEquipment,
} = require("../controllers/equipmentController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const { checkSubscription } = require("../middlewares/subscription");
const { upload } = require("../utils/fileUpload");

// Public routes
router.get("/", getAllEquipment);
router.get("/category/:category", getEquipmentByCategory);
router.get("/similar/:id", getSimilarEquipment);
router.get("/:id", getEquipment);

// Protected routes (require authentication)
router.get(
  "/recommendations/:designId",
  verifyFirebaseToken,
  checkSubscription("equipmentRecommendations"),
  getEquipmentRecommendations
);

// Admin-only routes with file upload support
router.post(
  "/",
  verifyFirebaseToken,
  checkSubscription("apiAccess"),
  upload.single("image"),
  createEquipment
);

router.put(
  "/:id",
  verifyFirebaseToken,
  checkSubscription("apiAccess"),
  upload.single("image"),
  updateEquipment
);

router.delete(
  "/:id",
  verifyFirebaseToken,
  checkSubscription("apiAccess"),
  deleteEquipment
);

module.exports = router;
