const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const admin = require("../config/firebse");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

// Cache frequently accessed data
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache duration

// Email Templates
const welcomeEmailTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2c3e50;">Welcome to Our Network Design Platform, ${name}!</h2>
    <p>We're excited to have you on board. Your account has been successfully created.</p>
    <p>With your account, you can:</p>
    <ul>
      <li>Design and plan network infrastructures</li>
      <li>Generate detailed network reports</li>
      <li>Collaborate with team members</li>
      <li>Get expert recommendations</li>
    </ul>
    <p>Start exploring the platform and create your first network design.</p>
    <p style="margin-top: 30px;">Best regards,<br>The Network Design Team</p>
  </div>
`;

const accountVerifiedTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2c3e50;">Account Verified Successfully</h2>
    <p>Dear ${name},</p>
    <p>Your email address has been successfully verified and your account is now fully activated.</p>
    <p>You can now access all features of our network design platform.</p>
    <p style="margin-top: 30px;">Best regards,<br>The Network Design Team</p>
  </div>
`;
const sendPasswordResetEmail = async (email) => {
  const resetLink = await admin.auth().generatePasswordResetLink(email);
  await sendEmail(
    "Password Reset Request",
    `Click <a href="${resetLink}">here</a> to reset your password.`,
    email
  );
};

// Test Route
const userTest = asyncHandler(async (req, res) => {
  console.log("User routes are ready..");
  res.send("Ready to handle employee - User routes..");
});

// User Registration with Email Notification
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, company, role, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false, // Will verify via email
    });

    // Generate Firebase Custom Token for immediate login
    const firebaseToken = await admin.auth().createCustomToken(userRecord.uid);

    // Save user in MongoDB with optimized write
    const user = await User.create({
      firebaseUID: userRecord.uid,
      name,
      email,
      company,
      role: role || "user", // Default role
      lastLogin: new Date(),
    });

    // Clear cache for this email
    userCache.delete(email);

    // Send welcome email (non-blocking)
    sendEmail(
      "Welcome to Our Network Design Platform",
      welcomeEmailTemplate(name),
      email
    ).catch((err) => console.error("Email sending failed:", err));

    // Send verification email via Firebase
    const verificationLink = await admin
      .auth()
      .generateEmailVerificationLink(email);

    await sendEmail(
      "Verify Your Email Address",
      `Please click <a href="${verificationLink}">here</a> to verify your email address.`,
      email
    );

    res.status(201).json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        firebaseUID: userRecord.uid,
        firebaseToken,
        createdAt: user.createdAt,
        message: "Verification email sent",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        success: false,
        error: "Email already in use",
      });
    }

    res.status(500).json({
      success: false,
      error: "Registration failed",
      details: error.message,
    });
  }
});

// Add this new endpoint to handle email verification webhook
const handleEmailVerification = asyncHandler(async (req, res) => {
  const { uid, email } = req.body;

  try {
    // Find user by firebaseUID
    const user = await User.findOneAndUpdate(
      { firebaseUID: uid },
      { $set: { emailVerified: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Send account verified email
    await sendEmail(
      "Account Verified Successfully",
      accountVerifiedTemplate(user.name),
      email
    );

    res.status(200).json({
      success: true,
      message: "Email verification processed",
      user: {
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("Email verification processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process email verification",
      details: error.message,
    });
  }
});

// Update loginUser to send notification on first login
const loginUser = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: "ID token is required",
    });
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check cache first
    const cacheKey = `user-${uid}`;
    if (userCache.has(cacheKey)) {
      const cachedUser = userCache.get(cacheKey);
      return res.json({
        success: true,
        data: cachedUser,
      });
    }

    // Fetch user from MongoDB with optimized query
    const user = await User.findOne({ firebaseUID: uid })
      .select("-__v -updatedAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if this is first login
    const isFirstLogin = !user.lastLogin;

    // Update last login without waiting
    User.updateOne({ firebaseUID: uid }, { lastLogin: new Date() })
      .then(async () => {
        if (isFirstLogin) {
          // Send first login notification (non-blocking)
          await sendEmail(
            "First Login Notification",
            `Welcome ${user.name}, we noticed this is your first login to our platform.`,
            user.email
          ).catch((err) => console.error("First login email failed:", err));
        }
      })
      .catch((err) => console.error("Login timestamp update failed:", err));

    // Prepare response data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      subscription: user.subscription,
      trial: user.trial,
      createdAt: user.createdAt,
      isFirstLogin,
    };

    // Cache the user data
    userCache.set(cacheKey, userData);
    setTimeout(() => userCache.delete(cacheKey), CACHE_TTL);

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        error: "Session expired, please login again",
      });
    }

    res.status(401).json({
      success: false,
      error: "Authentication failed",
      details: error.message,
    });
  }
});

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Authorization token required",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const cacheKey = `current-${decodedToken.uid}`;

    // Check cache first
    if (userCache.has(cacheKey)) {
      return res.json({
        success: true,
        data: userCache.get(cacheKey),
      });
    }

    const user = await User.findOne({ firebaseUID: decodedToken.uid })
      .select("name email role company subscription trial createdAt lastLogin")
      .populate("subscription.planId", "name price")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Cache the current user data
    userCache.set(cacheKey, user);
    setTimeout(() => userCache.delete(cacheKey), CACHE_TTL);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Current user fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current user",
      details: error.message,
    });
  }
});

// User Logout
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Authorization token required",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decodedToken.uid);

    // Clear user from cache
    userCache.delete(`user-${decodedToken.uid}`);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
      details: error.message,
    });
  }
});

// Get User Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID format",
    });
  }

  try {
    // Check cache first
    const cacheKey = `profile-${userId}`;
    if (userCache.has(cacheKey)) {
      return res.json({
        success: true,
        data: userCache.get(cacheKey),
      });
    }

    const user = await User.findById(userId)
      .select("-__v -updatedAt")
      .populate("subscription.planId", "name price features")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Cache the profile data
    userCache.set(cacheKey, user);
    setTimeout(() => userCache.delete(cacheKey), CACHE_TTL);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
      details: error.message,
    });
  }
});

// Get All Users (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // Check cache
    if (userCache.has("all-users")) {
      return res.json({
        success: true,
        data: userCache.get("all-users"),
      });
    }

    const users = await User.find()
      .select("-__v -updatedAt")
      .populate("subscription.planId", "name price")
      .lean();

    // Cache all users data
    userCache.set("all-users", users);
    setTimeout(() => userCache.delete("all-users"), CACHE_TTL);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      details: error.message,
    });
  }
});

// Clear cache endpoint (for development)
const clearCache = asyncHandler(async (req, res) => {
  userCache.clear();
  res.status(200).json({
    success: true,
    message: "User cache cleared",
    cacheSize: userCache.size,
  });
});

module.exports = {
  userTest,
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  logoutUser,
  getCurrentUser,
  clearCache,
  handleEmailVerification,
};
