const express = require("express");
const router = express.Router();
const {
  userTest,
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  logoutUser,
  getCurrentUser,
} = require("../controllers/userController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", userTest);

// Protected Routes
router.get("/all", verifyFirebaseToken, getAllUsers);
router.get("/profile/:id", verifyFirebaseToken, getUserProfile);
router.post("/logout", verifyFirebaseToken, logoutUser);
router.get("/current", verifyFirebaseToken, getCurrentUser);

module.exports = router;
