const express = require("express");
const router = express.Router();
const {
  getPlans,
  createSubscription,
  cancelSubscription,
  handleWebhook,
  upgradeSubscription,
  downgradeSubscription,
  getSubscriptionDetails,
  updatePaymentMethod,
  getInvoices,
  pauseSubscription,
  reactivateSubscription,
  getSubscriptionAnalytics,
  syncPlans,
  getPaystackPlans,
  syncPlansNow,
  getActivePlans,
  initializePayment,
  verifyPayment,
  trackPaymentEvent,
  getPaymentAnalytics,
} = require("../controllers/subscriptionController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");
const {
  checkSubscription,
  checkAdmin,
} = require("../middlewares/subscription");

// Public Routes (Webhook doesn't need authentication)
router.post("/webhook", handleWebhook);
//Non Protected Plans response.
router.get("/activeplans", getActivePlans);
router.get("/verify-payment", verifyPayment);

// Protected Routes (require Firebase authentication)
router.get("/plans", verifyFirebaseToken, getPlans);
router.post("/", verifyFirebaseToken, createSubscription);
router.delete("/", verifyFirebaseToken, cancelSubscription);
router.put("/upgrade", verifyFirebaseToken, upgradeSubscription);
router.put("/downgrade", verifyFirebaseToken, downgradeSubscription);
router.get("/details", verifyFirebaseToken, getSubscriptionDetails);
router.put("/payment-method", verifyFirebaseToken, updatePaymentMethod);
router.get("/invoices", verifyFirebaseToken, getInvoices);
router.post("/pause", verifyFirebaseToken, pauseSubscription);
router.post("/reactivate", verifyFirebaseToken, reactivateSubscription);

// Admin-only Routes (require admin privileges)
router.post("/sync-plans", verifyFirebaseToken, checkAdmin, syncPlans);
router.post("/sync-plans-now", verifyFirebaseToken, syncPlansNow);
router.get(
  "/paystack-plans",
  verifyFirebaseToken,
  checkAdmin,
  getPaystackPlans
);

// Analytics Route (admin or privileged users)
router.get(
  "/analytics",
  verifyFirebaseToken,
  checkSubscription("apiAccess"),
  getSubscriptionAnalytics
);

router.post(
  "/initialize-payment",
  //verifyFirebaseToken, // Keep this optional for new signups
  initializePayment
);

// Track payment events (authenticated users only)
router.post("/track-event", verifyFirebaseToken, trackPaymentEvent);

// Get analytics (admin only)
router.get("/analytics", verifyFirebaseToken, checkAdmin, getPaymentAnalytics);

// Feature-protected Routes (using subscription middleware)
router.get(
  "/premium-feature",
  verifyFirebaseToken,
  checkSubscription("advancedVisualization"),
  (req, res) => {
    res.json({ success: true, message: "Premium feature accessed" });
  }
);

module.exports = router;
