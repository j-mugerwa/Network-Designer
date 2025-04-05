const SubscriptionPlan = require("../models/SubscriptionPlanModel");
const User = require("../models/UserModel");
const axios = require("axios");
const asyncHandler = require("express-async-handler");
const { syncPlansFromPaystack } = require("../services/paystackSyncService");

// Initialize Paystack client
const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

const getPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });

    // Optionally fetch Paystack plans to verify status
    const paystackResponse = await paystack.get("/plan");
    const activePaystackPlans = paystackResponse.data.data;

    const enrichedPlans = plans.map((plan) => {
      const paystackPlan = activePaystackPlans.find(
        (p) => p.plan_code === plan.paystackPlanCode
      );
      return {
        ...plan._doc,
        paystackActive: !!paystackPlan,
        paystackPlanId: paystackPlan?.id || null,
      };
    });

    res.json({ success: true, data: enrichedPlans });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

const createSubscription = asyncHandler(async (req, res) => {
  try {
    const { planId, authorization_code } = req.body;

    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Verify the authorization code first
    const authResponse = await paystack.get(
      `/transaction/verify/${authorization_code}`
    );
    if (!authResponse.data.data.status === "success") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid authorization code" });
    }

    // Create Paystack subscription
    const subscriptionResponse = await paystack.post("/subscription", {
      customer: req.user.email, // Using email as customer identifier
      plan: plan.paystackPlanCode,
      authorization: authorization_code,
    });

    const subscription = subscriptionResponse.data.data;
    // Update user record
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          planId: plan._id,
          status: "active",
          startDate: new Date(),
          endDate: new Date(subscription.next_payment_date),
          paymentMethodId: authorization_code,
          paystackSubscriptionCode: subscription.subscription_code,
          paystackCustomerCode: subscription.customer.customer_code,
        },
        trial: { used: true },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        user,
        subscriptionId: subscription.id,
        subscriptionCode: subscription.subscription_code,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

const cancelSubscription = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No active subscription" });
    }

    await paystack.post("/subscription/disable", {
      code: user.subscription.paystackSubscriptionCode,
      token: user.subscription.paymentMethodId, // Using authorization code as token
    });

    // Update user record
    await User.findByIdAndUpdate(req.user._id, {
      "subscription.status": "canceled",
    });

    res.json({ success: true, message: "Subscription canceled successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const crypto = require("crypto");

  // Verify signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  try {
    switch (event.event) {
      case "subscription.create":
        await handleNewSubscription(event.data);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailure(event.data);
        break;
      case "subscription.disable":
        await handleSubscriptionCancellation(event.data);
        break;
      case "invoice.payment_success":
        await handlePaymentSuccess(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook handler failed");
  }
});

/**
 * @desc    Sync plans from Paystack
 * @route   POST /api/subscriptions/sync-plans
 * @access  Private (Admin)
 */
const syncPlans = asyncHandler(async (req, res) => {
  try {
    const result = await syncPlansFromPaystack();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: `Successfully synced ${result.synced} plans (${result.failed} failed)`,
      data: result.results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get Paystack plans (for debugging)
 * @route   GET /api/subscriptions/paystack-plans
 * @access  Private (Admin)
 */
const getPaystackPlans = asyncHandler(async (req, res) => {
  try {
    const response = await paystack.get("/plan");
    res.json({
      success: true,
      data: response.data.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// Helper functions for webhook handling
async function handleNewSubscription(data) {
  await User.findOneAndUpdate(
    { email: data.customer.email },
    {
      "subscription.status": "active",
      "subscription.startDate": new Date(data.createdAt),
      "subscription.endDate": new Date(data.next_payment_date),
      "subscription.paystackSubscriptionCode": data.subscription_code,
      "subscription.paystackCustomerCode": data.customer.customer_code,
    }
  );
}

async function handlePaymentSuccess(data) {
  await User.findOneAndUpdate(
    {
      "subscription.paystackSubscriptionCode":
        data.subscription.subscription_code,
    },
    {
      "subscription.status": "active",
      "subscription.endDate": new Date(data.subscription.next_payment_date),
    }
  );
}

async function handlePaymentFailure(data) {
  await User.findOneAndUpdate(
    {
      "subscription.paystackSubscriptionCode":
        data.subscription.subscription_code,
    },
    { "subscription.status": "past_due" }
  );
}

async function handleSubscriptionCancellation(data) {
  await User.findOneAndUpdate(
    { "subscription.paystackSubscriptionCode": data.subscription_code },
    { "subscription.status": "canceled" }
  );
}

/**
 * @desc    Upgrade user subscription
 * @route   PUT /api/subscriptions/upgrade
 * @access  Private
 */
const upgradeSubscription = asyncHandler(async (req, res) => {
  try {
    const { newPlanId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No active subscription to upgrade" });
    }

    // Get current and new plan details
    const currentPlan = await SubscriptionPlan.findById(
      user.subscription.planId
    );
    const newPlan = await SubscriptionPlan.findById(newPlanId);

    if (!newPlan) {
      return res
        .status(404)
        .json({ success: false, error: "New plan not found" });
    }

    // Paystack doesn't directly support plan upgrades, so we need to:
    // 1. Cancel current subscription
    await paystack.post("/subscription/disable", {
      code: user.subscription.paystackSubscriptionCode,
      token: user.subscription.paymentMethodId,
    });

    // 2. Create new subscription
    const subscriptionResponse = await paystack.post("/subscription", {
      customer: user.email,
      plan: newPlan.paystackPlanCode,
      authorization: user.subscription.paymentMethodId,
    });

    const subscription = subscriptionResponse.data.data;

    // Update user record
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          planId: newPlan._id,
          status: "active",
          startDate: new Date(),
          endDate: new Date(subscription.next_payment_date),
          paymentMethodId: user.subscription.paymentMethodId,
          paystackSubscriptionCode: subscription.subscription_code,
          paystackCustomerCode: subscription.customer.customer_code,
          renewal: true,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription upgraded successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Downgrade user subscription
 * @route   PUT /api/subscriptions/downgrade
 * @access  Private
 */
const downgradeSubscription = asyncHandler(async (req, res) => {
  try {
    const { newPlanId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No active subscription to downgrade" });
    }

    // Get current and new plan details
    const newPlan = await SubscriptionPlan.findById(newPlanId);

    if (!newPlan) {
      return res
        .status(404)
        .json({ success: false, error: "New plan not found" });
    }

    // Paystack doesn't directly support plan downgrades, same as upgrade flow
    // 1. Cancel current subscription
    await paystack.post("/subscription/disable", {
      code: user.subscription.paystackSubscriptionCode,
      token: user.subscription.paymentMethodId,
    });

    // 2. Create new subscription
    const subscriptionResponse = await paystack.post("/subscription", {
      customer: user.email,
      plan: newPlan.paystackPlanCode,
      authorization: user.subscription.paymentMethodId,
    });

    const subscription = subscriptionResponse.data.data;

    // Update user record
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          planId: newPlan._id,
          status: "active",
          startDate: new Date(),
          endDate: new Date(subscription.next_payment_date),
          paymentMethodId: user.subscription.paymentMethodId,
          paystackSubscriptionCode: subscription.subscription_code,
          paystackCustomerCode: subscription.customer.customer_code,
          renewal: true,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription downgraded successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Get subscription details
 * @route   GET /api/subscriptions/details
 * @access  Private
 */
const getSubscriptionDetails = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "subscription.planId"
    );

    if (!user.subscription.paystackSubscriptionCode) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          message: "No active subscription",
        },
      });
    }

    // Fetch details from Paystack
    const response = await paystack.get(
      `/subscription/${user.subscription.paystackSubscriptionCode}`
    );
    const paystackData = response.data.data;

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        userSubscription: user.subscription,
        paystackData: {
          status: paystackData.status,
          nextPaymentDate: paystackData.next_payment_date,
          createdAt: paystackData.createdAt,
          amount: paystackData.amount / 100, // Convert from kobo
          plan: paystackData.plan,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Update payment method
 * @route   PUT /api/subscriptions/payment-method
 * @access  Private
 */
const updatePaymentMethod = asyncHandler(async (req, res) => {
  try {
    const { authorization_code } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No active subscription" });
    }

    // Verify the new authorization code first
    const authResponse = await paystack.get(
      `/transaction/verify/${authorization_code}`
    );
    if (!authResponse.data.data.status === "success") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid authorization code" });
    }

    // Paystack requires us to create a new subscription with the new payment method
    const currentPlan = await SubscriptionPlan.findById(
      user.subscription.planId
    );

    // 1. Cancel current subscription
    await paystack.post("/subscription/disable", {
      code: user.subscription.paystackSubscriptionCode,
      token: user.subscription.paymentMethodId,
    });

    // 2. Create new subscription with new payment method
    const subscriptionResponse = await paystack.post("/subscription", {
      customer: user.email,
      plan: currentPlan.paystackPlanCode,
      authorization: authorization_code,
    });

    const subscription = subscriptionResponse.data.data;

    // Update user record
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          ...user.subscription,
          paymentMethodId: authorization_code,
          paystackSubscriptionCode: subscription.subscription_code,
          status: "active",
          startDate: new Date(),
          endDate: new Date(subscription.next_payment_date),
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Payment method updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Get subscription invoices
 * @route   GET /api/subscriptions/invoices
 * @access  Private
 */
const getInvoices = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackCustomerCode) {
      return res
        .status(400)
        .json({ success: false, error: "No customer record found" });
    }

    // Fetch transactions for this customer
    const response = await paystack.get(
      `/transaction?customer=${user.subscription.paystackCustomerCode}`
    );
    const invoices = response.data.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount / 100,
      currency: invoice.currency,
      status: invoice.status,
      paidAt: invoice.paid_at,
      reference: invoice.reference,
      plan: invoice.plan,
    }));

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Pause subscription
 * @route   POST /api/subscriptions/pause
 * @access  Private
 */
const pauseSubscription = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No active subscription" });
    }

    // Paystack doesn't directly support pausing, so we'll implement our own logic
    await User.findByIdAndUpdate(req.user._id, {
      "subscription.status": "paused",
      "subscription.endDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend by 30 days
    });

    res.json({
      success: true,
      message:
        "Subscription paused. You will not be charged until reactivated.",
      data: {
        status: "paused",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Reactivate subscription
 * @route   POST /api/subscriptions/reactivate
 * @access  Private
 */
const reactivateSubscription = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.paystackSubscriptionCode) {
      return res
        .status(400)
        .json({ success: false, error: "No subscription to reactivate" });
    }

    // Check if subscription exists in Paystack
    const response = await paystack.get(
      `/subscription/${user.subscription.paystackSubscriptionCode}`
    );
    const subscription = response.data.data;

    // Update user record
    await User.findByIdAndUpdate(req.user._id, {
      "subscription.status": "active",
      "subscription.endDate": new Date(subscription.next_payment_date),
      "subscription.renewal": true,
    });

    res.json({
      success: true,
      message: "Subscription reactivated successfully",
      data: {
        status: "active",
        nextPaymentDate: subscription.next_payment_date,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * @desc    Get subscription analytics
 * @route   GET /api/subscriptions/analytics
 * @access  Private (Admin only)
 */
const getSubscriptionAnalytics = asyncHandler(async (req, res) => {
  try {
    // Count users per plan
    const planDistribution = await User.aggregate([
      { $match: { "subscription.status": "active" } },
      { $group: { _id: "$subscription.planId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      { $project: { planName: "$plan.name", count: 1 } },
    ]);

    // Count subscriptions by status
    const statusDistribution = await User.aggregate([
      { $match: { "subscription.status": { $exists: true } } },
      { $group: { _id: "$subscription.status", count: { $sum: 1 } } },
    ]);

    // Monthly revenue projection
    const activeSubscriptions = await User.countDocuments({
      "subscription.status": "active",
    });
    const averageRevenue = await SubscriptionPlan.aggregate([
      { $group: { _id: null, avgPrice: { $avg: "$price" } } },
    ]);

    const monthlyRevenue =
      activeSubscriptions * (averageRevenue[0]?.avgPrice || 0);

    res.json({
      success: true,
      data: {
        planDistribution,
        statusDistribution,
        metrics: {
          totalSubscribers: activeSubscriptions,
          monthlyRevenue,
          trialUsers: await User.countDocuments({ "trial.used": false }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Manually synchronize plans from Paystack to MongoDB
 * @route   POST /api/subscriptions/sync-plans-now
 * @access  Private (Admin)
 */
const syncPlansNow = asyncHandler(async (req, res) => {
  try {
    // 1. Fetch all active plans from Paystack
    const response = await paystack.get("/plan", {
      params: {
        status: "active",
        perPage: 100, // Adjust based on your expected number of plans
      },
    });

    const paystackPlans = response.data.data;

    if (!paystackPlans || paystackPlans.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active plans found in Paystack",
      });
    }

    // 2. Process each plan
    const syncResults = await Promise.all(
      paystackPlans.map(async (paystackPlan) => {
        try {
          // Map Paystack plan to your MongoDB schema
          const planData = {
            name: paystackPlan.name,
            description: paystackPlan.description || "",
            price: paystackPlan.amount / 100, // Convert from kobo to naira
            billingPeriod: getBillingPeriod(paystackPlan.interval),
            paystackPlanCode: paystackPlan.plan_code,
            paystackPlanId: paystackPlan.id,
            isActive: true,
            //isActive: paystackPlan.status === "active",
            features: getPlanFeatures(paystackPlan),
          };

          // Update or create the plan in MongoDB
          const existingPlan = await SubscriptionPlan.findOneAndUpdate(
            { paystackPlanCode: paystackPlan.plan_code },
            planData,
            { upsert: true, new: true, runValidators: true }
          );

          return {
            success: true,
            planId: existingPlan._id,
            planCode: existingPlan.paystackPlanCode,
            action:
              existingPlan.createdAt.getTime() ===
              existingPlan.updatedAt.getTime()
                ? "created"
                : "updated",
          };
        } catch (error) {
          console.error(`Error syncing plan ${paystackPlan.plan_code}:`, error);
          return {
            success: false,
            planCode: paystackPlan.plan_code,
            error: error.message,
          };
        }
      })
    );

    // 3. Deactivate any local plans not in Paystack
    const activePlanCodes = paystackPlans.map((p) => p.plan_code);
    const deactivationResult = await SubscriptionPlan.updateMany(
      {
        paystackPlanCode: { $nin: activePlanCodes },
        isActive: true,
      },
      { isActive: false }
    );

    // 4. Prepare response
    const successfulSyncs = syncResults.filter((r) => r.success);
    const failedSyncs = syncResults.filter((r) => !r.success);

    res.json({
      success: true,
      message: `Synchronization complete. ${successfulSyncs.length} plans processed, ${failedSyncs.length} failed, ${deactivationResult.nModified} plans deactivated.`,
      stats: {
        totalPaystackPlans: paystackPlans.length,
        created: successfulSyncs.filter((r) => r.action === "created").length,
        updated: successfulSyncs.filter((r) => r.action === "updated").length,
        failed: failedSyncs.length,
        deactivated: deactivationResult.nModified,
      },
      details: {
        successful: successfulSyncs,
        failed: failedSyncs,
      },
    });
  } catch (error) {
    console.error("Manual plan synchronization failed:", error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// Helper function to convert Paystack interval to billing period
function getBillingPeriod(interval) {
  const intervals = {
    daily: "monthly", // Treat daily as monthly for your system
    weekly: "monthly", // Treat weekly as monthly
    monthly: "monthly",
    quarterly: "annual", // Treat quarterly as annual
    biannually: "annual",
    annually: "annual",
  };
  return intervals[interval.toLowerCase()] || "monthly";
}

// Helper function to determine features based on plan
function getPlanFeatures(paystackPlan) {
  // Default features
  const features = {
    maxDesigns: 5,
    maxTeamMembers: 1,
    advancedVisualization: false,
    equipmentRecommendations: false,
    configTemplates: false,
    apiAccess: false,
    prioritySupport: false,
    exportFormats: ["pdf"],
  };

  // Customize based on plan amount or name
  const amount = paystackPlan.amount / 100; // Convert to Naira

  if (amount >= 500000) {
    // Premium plan (₦5,000+)
    features.maxDesigns = 50;
    features.maxTeamMembers = 10;
    features.advancedVisualization = true;
    features.equipmentRecommendations = true;
    features.configTemplates = true;
    features.apiAccess = true;
    features.prioritySupport = true;
    features.exportFormats = ["pdf", "docx", "csv"];
  } else if (amount >= 200000) {
    // Professional plan (₦2,000+)
    features.maxDesigns = 20;
    features.maxTeamMembers = 5;
    features.advancedVisualization = true;
    features.equipmentRecommendations = true;
    features.configTemplates = true;
    features.exportFormats = ["pdf", "docx"];
  }

  return features;
}

module.exports = {
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
};
