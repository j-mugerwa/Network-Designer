const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const Design = require("../models/NetworkDesignModel");
const Report = require("../models/ReportModel");

const getSystemStats = asyncHandler(async (req, res) => {
  try {
    const [users, companies, designs, reports] = await Promise.all([
      User.countDocuments(),
      User.distinct("company").then((companies) => companies.length),
      Design.countDocuments(),
      Report.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        companies,
        designs,
        reports,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch system stats",
    });
  }
});

module.exports = {
  getSystemStats,
};
