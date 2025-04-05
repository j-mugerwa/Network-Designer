// services/schedulerService.js
const cron = require("node-cron");
const { syncPlansFromPaystack } = require("./paystackSyncService");

// Schedule daily sync at 2 AM
const setupPlanSyncSchedule = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Running daily Paystack plan synchronization...");
    try {
      const result = await syncPlansFromPaystack();
      console.log(
        `Sync completed: ${result.synced} plans synced, ${result.failed} failed`
      );
    } catch (error) {
      console.error("Scheduled sync failed:", error);
    }
  });
};

module.exports = {
  setupPlanSyncSchedule,
};
