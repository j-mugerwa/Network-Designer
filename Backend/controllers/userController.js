const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const admin = require("../config/firebse");

// Test Route
const userTest = asyncHandler(async (req, res) => {
  console.log("User routes are ready..");
  res.send("Ready to handle employee - User routes..");
});

//User registration
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, company, role, password } = req.body;
  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    // Generate Firebase Custom Token for Login
    const firebaseToken = await admin.auth().createCustomToken(userRecord.uid);
    // Save user in MongoDB
    const user = await User.create({
      firebaseUID: userRecord.uid,
      name,
      email,
      company,
      role,
    });
    res.status(201).json({
      _id: user.id,
      name,
      email,
      company,
      role,
      firebaseUID: userRecord.uid,
      firebaseToken, // Send the token back
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//User Login
const loginUser = async (req, res) => {
  const { idToken } = req.body; // Get the token from the frontend

  try {
    // Verify the ID token sent by the frontend
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user from MongoDB
    const user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //console.log(user.name, " Logged in successfully..")
    res.json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(401).json({ message: "Invalid credentials" });
  }
};

//Logout the user.
const logoutUser = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    // Decode token to get UID
    const decodedToken = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decodedToken.uid);
    //console.log("User Logged out")
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Failed to log out" });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid user ID" });
  }
});

//Get current user:
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firebaseUID: user.firebaseUID,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// @desc    Get all users
// @route   GET /api/users/all
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().populate("role", "name");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  userTest,
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  logoutUser,
  getCurrentUser,
};
