// services/paystackSyncService.js
const SubscriptionPlan = require("../models/SubscriptionPlanModel");
const axios = require("axios");

const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Synchronizes plans from Paystack to MongoDB
 */
const syncPlansFromPaystack = async () => {
  try {
    // 1. Fetch all plans from Paystack
    const response = await paystackApi.get("/plan", {
      params: {
        status: "active", // Only sync active plans
        perPage: 100, // Adjust based on your expected plan count
      },
    });

    const paystackPlans = response.data.data;

    // 2. Process each plan
    const syncResults = await Promise.all(
      paystackPlans.map(async (paystackPlan) => {
        try {
          // Map Paystack plan to your MongoDB schema
          const planData = {
            name: paystackPlan.name,
            description: paystackPlan.description || "",
            price: paystackPlan.amount / 100, // Convert from kobo to naira
            billingPeriod: paystackPlan.interval.toLowerCase(), // 'monthly' or 'annual'
            paystackPlanCode: paystackPlan.plan_code,
            paystackPlanId: paystackPlan.id,
            isActive: paystackPlan.status === "active",
            features: mapPaystackPlanToFeatures(paystackPlan),
          };

          // Update or create the plan in MongoDB
          const existingPlan = await SubscriptionPlan.findOneAndUpdate(
            { paystackPlanCode: paystackPlan.plan_code },
            planData,
            { upsert: true, new: true }
          );

          return {
            success: true,
            planId: existingPlan._id,
            action:
              existingPlan.createdAt === existingPlan.updatedAt
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

    return {
      success: true,
      synced: syncResults.filter((r) => r.success).length,
      failed: syncResults.filter((r) => !r.success).length,
      results: syncResults,
    };
  } catch (error) {
    console.error("Plan synchronization failed:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

//Maps Paystack plan to your feature set
const mapPaystackPlanToFeatures = (paystackPlan) => {
  // Default features for all plans
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

  // Customize based on plan name or amount
  if (paystackPlan.amount >= 500000) {
    // Premium plan (₦5,000+)
    features.maxDesigns = 50;
    features.maxTeamMembers = 10;
    features.advancedVisualization = true;
    features.equipmentRecommendations = true;
    features.configTemplates = true;
    features.apiAccess = true;
    features.prioritySupport = true;
    features.exportFormats = ["pdf", "docx", "csv"];
  } else if (paystackPlan.amount >= 200000) {
    // Professional plan (₦2,000+)
    features.maxDesigns = 20;
    features.maxTeamMembers = 5;
    features.advancedVisualization = true;
    features.equipmentRecommendations = true;
    features.configTemplates = true;
    features.exportFormats = ["pdf", "docx"];
  }

  return features;
};
module.exports = {
  syncPlansFromPaystack,
};
