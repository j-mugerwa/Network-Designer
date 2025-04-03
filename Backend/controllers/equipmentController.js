const asyncHandler = require("express-async-handler");
const Equipment = require("../models/EquipmentModel");
const EquipmentRecommendation = require("../models/EquipmentRecommendationModel");
const NetworkDesign = require("../models/NetworkDesignModel");
//const { upload } = require("../utils/fileUpload");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  shouldUseCloudinary,
  deleteLocalFile,
} = require("../utils/cloudinaryUtils");

// Helper functions for equipment calculations
const calculateSwitchNeeds = (design) => {
  // Your existing switch calculation logic
  return {
    ports: Math.ceil(design.requirements.wiredUsers / 24) * 48, // Example calculation
    speed: design.requirements.bandwidth > 500 ? "10G" : "1G",
    count: Math.ceil(design.requirements.wiredUsers / 24),
  };
};

const calculateRouterNeeds = (design) => {
  // Your existing router calculation logic
  return {
    ports: 2 + (design.requirements.networkSegmentation ? 1 : 0),
    speed: "10G",
    count: 1,
  };
};

const calculateFirewallNeeds = (design) => {
  // Your existing firewall calculation logic
  return {
    ports: 2,
    speed: "10G",
    count: 1,
  };
};

/**
 * @desc    Create new equipment
 * @route   POST /api/equipment
 * @access  Private (Admin only)
 */
const createEquipment = asyncHandler(async (req, res) => {
  try {
    const { category, manufacturer, model, specs, priceRange, typicalUseCase } =
      req.body;

    // Validate required fields
    if (!category || !manufacturer || !model || !specs) {
      return res.status(400).json({
        success: false,
        error: "Category, manufacturer, model, and specs are required",
      });
    }

    // Parse specs if it's a string
    const parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;

    let imageUrl = "";

    // Handle file upload if present and Cloudinary is enabled
    if (req.file && shouldUseCloudinary()) {
      try {
        imageUrl = await uploadToCloudinary(req.file.path, "equipment");
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload image",
          details: uploadError.message,
        });
      }
    } else if (req.file) {
      // Handle local file storage if Cloudinary is disabled
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const equipment = await Equipment.create({
      category,
      manufacturer,
      model,
      specs: parsedSpecs,
      priceRange: priceRange || "$$",
      typicalUseCase: typicalUseCase || "General purpose",
      imageUrl,
    });

    res.status(201).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get all equipment
 * @route   GET /api/equipment
 * @access  Public
 */
const getAllEquipment = asyncHandler(async (req, res) => {
  try {
    // Add pagination, filtering, and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by manufacturer if provided
    if (req.query.manufacturer) {
      query.manufacturer = req.query.manufacturer;
    }

    // Filter by port speed if provided
    if (req.query.portSpeed) {
      query["specs.portSpeed"] = req.query.portSpeed;
    }

    const equipment = await Equipment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ manufacturer: 1, model: 1 });

    const total = await Equipment.countDocuments(query);

    res.json({
      success: true,
      count: equipment.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get single equipment
 * @route   GET /api/equipment/:id
 * @access  Public
 */
const getEquipment = asyncHandler(async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: "Equipment not found",
      });
    }

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Update equipment
 * @route   PUT /api/equipment/:id
 * @access  Private (Admin only)
 */
const updateEquipment = asyncHandler(async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: "Equipment not found",
      });
    }

    // Handle image update if new file is provided
    let imageUrl = "";

    // Handle file upload if present and Cloudinary is enabled
    if (req.file && shouldUseCloudinary()) {
      try {
        imageUrl = await uploadToCloudinary(req.file.path, "equipment");
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload image",
          details: uploadError.message,
        });
      }
    } else if (req.file) {
      // Handle local file storage if Cloudinary is disabled
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update other fields
    equipment.category = req.body.category || equipment.category;
    equipment.manufacturer = req.body.manufacturer || equipment.manufacturer;
    equipment.model = req.body.model || equipment.model;

    if (req.body.specs) {
      equipment.specs =
        typeof req.body.specs === "string"
          ? JSON.parse(req.body.specs)
          : req.body.specs;
    }

    equipment.priceRange = req.body.priceRange || equipment.priceRange;
    equipment.typicalUseCase =
      req.body.typicalUseCase || equipment.typicalUseCase;

    await equipment.save();

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Delete equipment
 * @route   DELETE /api/equipment/:id
 * @access  Private (Admin only)
 */
const deleteEquipment = asyncHandler(async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: "Equipment not found",
      });
    }

    // Async image deletion (don't await to make it non-blocking)
    if (equipment.imageUrl) {
      const deleteImage = shouldUseCloudinary()
        ? deleteFromCloudinary(equipment.imageUrl)
        : deleteLocalFile(equipment.imageUrl);

      deleteImage.catch((err) =>
        console.error(
          `Failed to delete ${
            shouldUseCloudinary() ? "Cloudinary" : "local"
          } image:`,
          err
        )
      );
    }

    res.json({
      success: true,
      data: {},
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    console.error("Delete equipment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete equipment",
      details:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
});
/**
 * @desc    Get equipment recommendations for a design
 * @route   GET /api/equipment/recommendations/:designId
 * @access  Private
 */
const getEquipmentRecommendations = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findById(req.params.designId);

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Network design not found",
      });
    }

    // Get requirements
    const switchRequirements = calculateSwitchNeeds(design);
    const routerRequirements = calculateRouterNeeds(design);
    const firewallRequirements = calculateFirewallNeeds(design);

    // Build queries
    const queries = {
      switch: {
        category: "switch",
        "specs.ports": { $gte: switchRequirements.ports },
        "specs.portSpeed": switchRequirements.speed,
      },
      router: {
        category: "router",
        "specs.ports": { $gte: routerRequirements.ports },
        "specs.portSpeed": routerRequirements.speed,
      },
      firewall: {
        category: "firewall",
        "specs.ports": { $gte: firewallRequirements.ports },
        "specs.portSpeed": firewallRequirements.speed,
      },
    };

    // Execute queries in parallel
    const [switches, routers, firewalls] = await Promise.all([
      Equipment.find(queries.switch).sort({ priceRange: 1 }),
      Equipment.find(queries.router).sort({ priceRange: 1 }),
      Equipment.find(queries.firewall).sort({ priceRange: 1 }),
    ]);

    // Create recommendation
    const recommendation = new EquipmentRecommendation({
      designId: design._id,
      userId: req.user._id,
      recommendations: [
        {
          category: "switch",
          recommendedEquipment: switches[0]?._id,
          quantity: switchRequirements.count,
          placement: "Core distribution",
          justification: `Based on ${design.requirements.totalUsers} users and ${design.requirements.bandwidth}Mbps bandwidth`,
          alternatives: switches.slice(1, 3).map((e) => e._id), // Include alternatives
        },
        {
          category: "router",
          recommendedEquipment: routers[0]?._id,
          quantity: routerRequirements.count,
          placement: "Network edge",
          justification: "For routing between network segments",
          alternatives: routers.slice(1, 3).map((e) => e._id),
        },
        {
          category: "firewall",
          recommendedEquipment: firewalls[0]?._id,
          quantity: firewallRequirements.count,
          placement: "Between border router and ISP",
          justification: "For network security and traffic filtering",
          alternatives: firewalls.slice(1, 3).map((e) => e._id),
        },
      ],
    });

    await recommendation.save();

    // Populate equipment details in the response
    const populatedRecommendation = await EquipmentRecommendation.findById(
      recommendation._id
    )
      .populate("recommendations.recommendedEquipment")
      .populate("recommendations.alternatives");

    res.json({
      success: true,
      data: populatedRecommendation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get equipment by category
 * @route   GET /api/equipment/category/:category
 * @access  Public
 */
const getEquipmentByCategory = asyncHandler(async (req, res) => {
  try {
    const equipment = await Equipment.find({
      category: req.params.category,
    }).sort({ manufacturer: 1, model: 1 });

    res.json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get similar equipment
 * @route   GET /api/equipment/similar/:id
 * @access  Public
 */
const getSimilarEquipment = asyncHandler(async (req, res) => {
  try {
    const currentEquipment = await Equipment.findById(req.params.id);

    if (!currentEquipment) {
      return res.status(404).json({
        success: false,
        error: "Equipment not found",
      });
    }

    const similar = await Equipment.find({
      category: currentEquipment.category,
      manufacturer: currentEquipment.manufacturer,
      _id: { $ne: currentEquipment._id },
    }).limit(5);

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  createEquipment,
  getAllEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentRecommendations,
  getEquipmentByCategory,
  getSimilarEquipment,
};
