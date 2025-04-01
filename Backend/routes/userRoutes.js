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
  handleEmailVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", userTest);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected Routes
router.get("/all", verifyFirebaseToken, getAllUsers);
router.get("/profile/:id", verifyFirebaseToken, getUserProfile);
router.post("/logout", verifyFirebaseToken, logoutUser);
router.get("/current", verifyFirebaseToken, getCurrentUser);
router.post("/verify-email", verifyFirebaseToken, handleEmailVerification);

module.exports = router;
