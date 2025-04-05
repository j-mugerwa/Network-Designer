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
  convertTrialToPaid, // Add the new controller import
} = require("../controllers/userController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const { checkTrialStatus } = require("../middlewares/subscription");
const rateLimit = require("express-rate-limit");

const convertTrialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many conversion attempts, please try again later",
});

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

// Subscription Management Routes
router.post(
  "/convert-trial",
  verifyFirebaseToken,
  checkTrialStatus, // Optional middleware to check trial status
  convertTrialLimiter,
  convertTrialToPaid
);

module.exports = router;
