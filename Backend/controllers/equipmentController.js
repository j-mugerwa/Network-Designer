const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const Equipment = require("../models/EquipmentModel");
const EquipmentRecommendation = require("../models/EquipmentRecommendationModel");

const getEquipmentRecommendations = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findById(req.params.designId);

    // Get core switching requirements
    const switchRequirements = calculateSwitchNeeds(design);
    const routerRequirements = calculateRouterNeeds(design);
    const firewallRequirements = calculateFirewallNeeds(design);

    // Query equipment database for matches
    // Switches
    const switches = await Equipment.find({
      category: "switch",
      "specs.ports": { $gte: switchRequirements.ports },
      "specs.portSpeed": switchRequirements.speed,
    }).sort({ priceRange: 1 });
    //Routers
    const routers = await Equipment.find({
      category: "switch",
      "specs.ports": { $gte: routerRequirements.ports },
      "specs.portSpeed": routerRequirements.speed,
    }).sort({ priceRange: 1 });
    //Firewalls
    const firewalls = await Equipment.find({
      category: "switch",
      "specs.ports": { $gte: firewallRequirements.ports },
      "specs.portSpeed": firewallRequirements.speed,
    }).sort({ priceRange: 1 });

    // Create recommendation document
    const recommendation = new EquipmentRecommendation({
      designId: design._id,
      recommendations: [
        {
          category: "switch",
          recommendedEquipment: switches[0]._id,
          quantity: switchRequirements.count,
          placement: "Core distribution",
          justification: `Based on ${design.requirements.totalUsers} users and ${design.requirements.bandwidth}Mbps bandwidth`,
        },
        {
          category: "router",
          recommendedEquipment: routers[0]._id,
          quantity: routerRequirements.count,
          placement: "At the border",
          justification: "For routing of your network traffic",
        },
        {
          category: "firewall",
          recommendedEquipment: firewalls[0]._id,
          quantity: firewallRequirements.count,
          placement: "Between your Border Router and ISP",
          justification: "You need to filter traffic before movement..",
        },
      ],
    });

    await recommendation.save();

    res.json({ success: true, data: recommendation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = {
  getEquipmentRecommendations,
};
