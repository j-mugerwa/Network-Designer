const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const DesignVersion = require("../models/DesignVersionModel");

//Create a version.
const createVersion = asyncHandler(async (req, res) => {
  try {
    const { designId } = req.params;

    // Get current design and latest version
    const design = await NetworkDesign.findById(designId);
    const latestVersion = await DesignVersion.findOne({ designId })
      .sort({ version: -1 })
      .limit(1);

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version
    const version = new DesignVersion({
      designId,
      version: newVersionNumber,
      snapshot: design.toObject(),
      createdBy: req.user._id,
      changes: req.body.changes || [],
    });

    await version.save();

    res.json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Compare versions.
const compareVersions = asyncHandler(async (req, res) => {
  try {
    const { designId, version1, version2 } = req.params;

    const versions = await DesignVersion.find({
      designId,
      version: { $in: [Number(version1), Number(version2)] },
    }).sort({ version: 1 });

    if (versions.length !== 2) {
      return res
        .status(404)
        .json({ success: false, error: "Versions not found" });
    }

    const differences = findDifferences(
      versions[0].snapshot,
      versions[1].snapshot
    );

    res.json({ success: true, data: differences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = {
  createVersion,
  compareVersions,
};
