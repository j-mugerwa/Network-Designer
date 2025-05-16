const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const admin = require("../config/firebse");
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");
const SubscriptionPlan = require("../models/SubscriptionPlanModel");
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

// Test Route
const userTest = asyncHandler(async (req, res) => {
  console.log("User routes are ready..");
  res.send("Ready to handle employee - User routes..");
});

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// User Registration with Email Notification
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, company, role, password, terms } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }
  let userRecord;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // 1. Create Firebase user
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // 2. Find the default plan in MongoDB
    const defaultPlan = await SubscriptionPlan.findOne({
      name: "Default",
      isActive: true,
    });

    if (!defaultPlan) {
      throw new Error("Default subscription plan not found");
    }

    // 3. Create Paystack customer
    const paystackCustomer = await paystack.post("/customer", {
      email,
      first_name: name.split(" ")[0],
      last_name: name.split(" ")[1] || "",
      metadata: {
        firebase_uid: userRecord.uid,
        company,
      },
    });

    // 4. Calculate trial period dates
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

    // 5. Create user in MongoDB with trial status
    const user = await User.create({
      firebaseUID: userRecord.uid,
      name,
      email,
      company,
      role: role || "user",
      terms: true,
      lastLogin: new Date(),
      trial: {
        used: false,
        expiresAt: trialEndDate,
      },
      subscription: {
        planId: defaultPlan._id,
        status: "trial",
        startDate: new Date(),
        endDate: trialEndDate,
        paystackCustomerCode: paystackCustomer.data.data.customer_code,
        // No subscription code yet - will be added when trial converts to paid
        paymentMethodId: null, // Will be set when user adds payment method
      },
      //Shall edit to capture the subscription plan well
    });

    // 6. Send emails (verification and welcome)
    const verificationLink = await admin
      .auth()
      .generateEmailVerificationLink(email);

    await Promise.all([
      sendEmail(
        "Welcome to Our Network Design Platform",
        welcomeEmailTemplate(name),
        email
      ),
      sendEmail(
        "Verify Your Email Address",
        `Click <a href="${verificationLink}">here</a> to verify your email.`,
        email
      ),
    ]).catch((err) => console.error("Email sending error:", err));

    // 7. Return response
    res.status(201).json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        terms: user.terms,
        subscription: {
          plan: defaultPlan.name,
          status: "trial",
          trialEnd: trialEndDate,
        },
        firebaseToken: await admin.auth().createCustomToken(userRecord.uid),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Cleanup if something failed
    if (userRecord) {
      try {
        await admin.auth().deleteUser(userRecord.uid);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    // Handle specific errors
    const errorMap = {
      "auth/email-already-exists": "Email already in use",
      "Default subscription plan not found": "System configuration error",
      "auth/email-already-in-use": "Email already registered",
      "auth/invalid-email": "Invalid email address",
      "auth/weak-password": "Password should be at least 6 characters",
    };

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMap[error.message] || "Registration failed",
      details: error.response?.data?.message || error.message,
    });
  }
});

//Convert a trial user to a paid plan
const convertTrialToPaid = asyncHandler(async (req, res) => {
  const { plan_code, payment_reference } = req.body;
  const { uid, _id, email, fullUserDoc } = req.user;

  try {
    const user = fullUserDoc;

    // Check trial status
    if (user.trial.used) {
      return res.status(400).json({
        success: false,
        error: "Trial already converted to paid subscription",
      });
    }

    if (new Date() > new Date(user.trial.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: "Trial period has ended",
      });
    }

    // Verify plan exists
    const planResponse = await paystack.get(`/plan/${plan_code}`);
    if (!planResponse.data.data) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan code",
      });
    }

    if (!payment_reference) {
      // Payment initialization
      const paymentResponse = await paystack.post("/transaction/initialize", {
        email: user.email,
        amount: planResponse.data.data.amount,
        plan: plan_code,
        metadata: {
          firebaseUID: uid,
          mongoUserId: _id,
          plan_code,
          action: "trial_conversion",
        },
        callback_url: `${process.env.FRONTEND_URL}/payment-callback`,
      });

      return res.json({
        success: true,
        message: "Payment initialization successful",
        data: {
          authorization_url: paymentResponse.data.data.authorization_url,
          reference: paymentResponse.data.data.reference,
        },
      });
    } else {
      // Payment verification and subscription creation
      const verification = await paystack.get(
        `/transaction/verify/${payment_reference}`
      );

      if (verification.data.data.status !== "success") {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed",
          details: verification.data.data,
        });
      }

      // Create subscription
      const subscriptionResponse = await paystack.post("/subscription", {
        customer: user.email,
        plan: plan_code,
        authorization: verification.data.data.authorization.authorization_code,
      });

      // Verify subscription creation
      if (!subscriptionResponse.data.data?.subscription_code) {
        throw new Error("Paystack subscription creation failed");
      }

      // Prepare update data with atomic operations
      const updateData = {
        $set: {
          "subscription.status": "active",
          "subscription.paystackSubscriptionCode":
            subscriptionResponse.data.data.subscription_code,
          "subscription.paymentMethodId":
            verification.data.data.authorization.authorization_code,
          "subscription.nextPaymentDate": new Date(
            subscriptionResponse.data.data.next_payment_date
          ),
          "subscription.lastPaymentDate": new Date(),
          "subscription.startDate": new Date(),
          "subscription.endDate": new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ),
          isTrial: false,
          "trial.used": true,
          updatedAt: new Date(),
        },
      };

      // Update user document with additional validation
      const updatedUser = await User.findOneAndUpdate(
        { _id, "subscription.status": "trial" }, // Only update if status is trial
        updateData,
        {
          new: true,
          runValidators: true,
          context: "query",
        }
      ).populate("subscription.planId");

      // Verify the update was successful
      if (!updatedUser || updatedUser.subscription.status !== "active") {
        console.error("Update verification failed", {
          updatedUser: updatedUser?.toObject(),
          updateData,
        });
        throw new Error("Failed to update user subscription status");
      }

      // Send confirmation email
      await sendEmail(
        "Subscription Activated",
        `Your account has been successfully upgraded to ${
          updatedUser.subscription.planId?.name || planResponse.data.data.name
        } plan.`,
        email
      );

      return res.json({
        success: true,
        message: "Subscription created successfully",
        data: {
          user: {
            _id: updatedUser._id,
            email: updatedUser.email,
            subscription: {
              status: updatedUser.subscription.status,
              planId: updatedUser.subscription.planId,
              startDate: updatedUser.subscription.startDate,
              endDate: updatedUser.subscription.endDate,
            },
            isTrial: updatedUser.isTrial,
          },
          subscription: subscriptionResponse.data.data,
        },
      });
    }
  } catch (error) {
    console.error("Subscription conversion error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      details:
        process.env.NODE_ENV === "development"
          ? {
              stack: error.stack,
              fullError: error,
            }
          : undefined,
    });
  }
});

//Handle email verification webhook
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

/**
 * @desc    Initiate password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Check if email exists in both Firebase and MongoDB
  try {
    // Check Firebase first
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "No user found with that email address",
      });
    }

    // Check MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No user found with that email address",
      });
    }

    // 2. Generate password reset link via Firebase
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: process.env.PASSWORD_RESET_REDIRECT_URL, // Your frontend reset page
      handleCodeInApp: true,
    });

    // 3. Send email with reset link
    await sendEmail(
      "Password Reset Request",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>You recently requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetLink}"
           style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        <p style="margin-top: 30px;">Best regards,<br>The Network Design Team</p>
      </div>
      `,
      email
    );

    // 4. Update user record (optional)
    user.passwordResetToken = resetLink; // Store hashed token in production
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      error: "Error sending password reset email",
      details: error.message,
    });
  }
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // 1. Verify the token with Firebase
    // Note: Firebase handles token verification internally when the link is used
    // This endpoint is for the frontend to submit the new password

    // 2. Get email from token (you might need to parse it from your stored token)
    // In production, you'd verify the token properly
    const email = req.body.email; // Should come from your frontend form

    // 3. Update password in Firebase
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    // 4. Update user record in MongoDB
    await User.findOneAndUpdate(
      { email },
      {
        passwordResetToken: null,
        passwordResetExpires: null,
        lastPasswordChange: new Date(),
      }
    );

    // 5. Send confirmation email
    await sendEmail(
      "Password Changed Successfully",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Updated</h2>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <p style="margin-top: 30px;">Best regards,<br>The Network Design Team</p>
      </div>
      `,
      email
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(400).json({
      success: false,
      error: "Password reset failed",
      details: error.message,
    });
  }
});

module.exports = {
  userTest,
  registerUser,
  convertTrialToPaid,
  loginUser,
  getUserProfile,
  getAllUsers,
  logoutUser,
  getCurrentUser,
  clearCache,
  handleEmailVerification,
  forgotPassword,
  resetPassword,
};
