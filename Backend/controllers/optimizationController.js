const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const DesignPattern = require("../models/DesignPatternModel");
const DesignOptimization = require("../models/DesignOptimizationModel");

const optimizeDesign = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findById(req.params.designId);

    // Find similar successful designs from database
    const similarPatterns = await DesignPattern.find({
      "characteristics.userCount": design.requirements.totalUsers,
      "characteristics.bandwidth": {
        $gte: design.requirements.bandwidth * 0.8,
      },
    }).sort({ "successMetrics.performanceScore": -1 });

    if (similarPatterns.length === 0) {
      return res.json({
        success: true,
        message: "No optimization patterns found",
      });
    }
    // Apply best pattern to current design
    const bestPattern = similarPatterns[0];
    const optimizedDesign = applyPattern(design, bestPattern);

    // Create optimization record
    const optimization = new DesignOptimization({
      originalDesignId: design._id,
      optimizedDesign,
      improvements: calculateImprovements(design, optimizedDesign),
    });

    await optimization.save();

    res.json({ success: true, data: optimization });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = {
  optimizeDesign,
};
