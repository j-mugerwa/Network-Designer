const asyncHandler = require("express-async-handler");
const Equipment = require("../models/EquipmentModel");
const User = require("../models/UserModel");
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

/*
const createEquipment = asyncHandler(async (req, res) => {
  try {
    const {
      category,
      manufacturer,
      model,
      specs,
      priceRange,
      typicalUseCase,
      isPublic,
    } = req.body;

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

    // Handle file upload if present
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
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Check if user is admin trying to create system-owned equipment
    const isSystemOwned =
      req.user.fullUserDoc.role === "admin" && req.body.isSystemOwned;

    const equipment = await Equipment.create({
      category,
      manufacturer,
      model,
      specs: parsedSpecs,
      priceRange: priceRange || "$$",
      typicalUseCase: typicalUseCase || "General purpose",
      imageUrl,
      createdBy: req.user._id,
      isSystemOwned,
      isPublic: isPublic || isSystemOwned, // System-owned equipment is always public
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
*/

const createEquipment = asyncHandler(async (req, res) => {
  try {
    const {
      category,
      manufacturer,
      model,
      specs,
      priceRange,
      typicalUseCase,
      isPublic,
      datasheetUrl,
      isPopular,
      releaseYear,
      endOfLife,
      warranty,
      location,
      networkConfig,
      maintenance,
      isActive,
    } = req.body;

    // Validate required fields
    if (!category || !manufacturer || !model || !specs) {
      return res.status(400).json({
        success: false,
        error: "Category, manufacturer, model, and specs are required",
      });
    }

    // Parse specs if it's a string
    const parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;

    // Validate IP addresses in specs and networkConfig
    const validateIP = (ip) => {
      if (!ip) return true;
      return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ip
      );
    };

    if (parsedSpecs.managementIp && !validateIP(parsedSpecs.managementIp)) {
      return res.status(400).json({
        success: false,
        error: "Invalid management IP address format",
      });
    }

    if (networkConfig?.ipAddress && !validateIP(networkConfig.ipAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid network IP address format",
      });
    }

    // Handle file uploads
    let imageUrl = "";
    let datasheetFileUrl = "";

    // Handle image upload
    if (req.files?.image) {
      try {
        imageUrl = await uploadToCloudinary(
          req.files.image[0].path,
          "equipment/images"
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload image",
          details: uploadError.message,
        });
      }
    }

    // Handle datasheet upload if present
    if (req.files?.datasheet) {
      try {
        datasheetFileUrl = await uploadToCloudinary(
          req.files.datasheet[0].path,
          "equipment/datasheets"
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: "Failed to upload datasheet",
          details: uploadError.message,
        });
      }
    }

    // Check if user is admin trying to create system-owned equipment
    const isSystemOwned =
      req.user.fullUserDoc.role === "admin" && req.body.isSystemOwned;

    // Parse date fields
    const parseDate = (dateString) => {
      if (!dateString) return undefined;
      return new Date(dateString);
    };

    // Create equipment with all fields
    const equipment = await Equipment.create({
      category,
      manufacturer,
      model,
      specs: parsedSpecs,
      priceRange: priceRange || "$$",
      typicalUseCase: typicalUseCase || "General purpose",
      imageUrl,
      datasheetUrl: datasheetFileUrl || datasheetUrl,
      isPopular: isPopular || false,
      releaseYear,
      endOfLife: parseDate(endOfLife),
      warranty: warranty || { type: "limited" },
      createdBy: req.user._id,
      isSystemOwned,
      isPublic: isPublic || isSystemOwned, // System-owned equipment is always public
      isActive: isActive !== false, // Default to true if not specified
      location: location || {},
      networkConfig: networkConfig || {},
      maintenance: maintenance
        ? {
            ...maintenance,
            lastMaintained: parseDate(maintenance.lastMaintained),
          }
        : {},
    });

    res.status(201).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error("Error creating equipment:", error);
    res.status(500).json({
      success: false,
      error: "Server error occurred while creating equipment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Create system-owned equipment (admin only)
 * @route   POST /api/equipment/system
 * @access  Private (Admin only)
 */
const createSystemEquipment = asyncHandler(async (req, res) => {
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

    // Handle file upload if present
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
      createdBy: req.user._id,
      isSystemOwned: true,
      isPublic: true,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { isPublic: true }; // Only show public equipment by default

    // For authenticated users, include their private equipment
    if (req.user) {
      query = {
        $or: [{ isPublic: true }, { createdBy: req.user._id }],
      };
    }

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

    // Filter by system-owned if specified
    if (req.query.systemOwned === "true") {
      query.isSystemOwned = true;
    } else if (req.query.systemOwned === "false") {
      query.isSystemOwned = false;
    }

    const equipment = await Equipment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ isSystemOwned: -1, manufacturer: 1, model: 1 }); // System-owned first

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
        error: "Equipment is not found",
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

/*
const getUserEquipment = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Convert the string ID to ObjectId
    const query = {
      createdBy: mongoose.Types.ObjectId(req.user._id),
    };

    const equipment = await Equipment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email"); // Optional: populate user details

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
*/

const getUserEquipment = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // First get the full user document to ensure we have the right ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const query = { createdBy: user._id }; // Use the user's _id directly

    const equipment = await Equipment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

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
    console.error("Error in getUserEquipment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user equipment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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

/*
const getEquipmentRecommendations = asyncHandler(async (req, res) => {
  try {
    console.log("Fetching design:", req.params.designId);
    const design = await NetworkDesign.findById(req.params.designId);

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Network design was not found",
      });
    }

    // Get requirements
    console.log("Calculating switch needs");
    const switchRequirements = calculateSwitchNeeds(design);
    console.log("Switch requirements:", switchRequirements);
    const routerRequirements = calculateRouterNeeds(design);
    console.log("Router requirements:", routerRequirements);
    const firewallRequirements = calculateFirewallNeeds(design);
    console.log("Firewall requirements:", firewallRequirements);

    // Build queries - prioritize system-owned equipment for recommendations
    const queries = {
      switch: {
        category: "switch",
        "specs.ports": { $gte: switchRequirements.ports },
        "specs.portSpeed": switchRequirements.speed,
        isSystemOwned: true,
      },
      router: {
        category: "router",
        "specs.ports": { $gte: routerRequirements.ports },
        "specs.portSpeed": routerRequirements.speed,
        isSystemOwned: true,
      },
      firewall: {
        category: "firewall",
        "specs.ports": { $gte: firewallRequirements.ports },
        "specs.portSpeed": firewallRequirements.speed,
        isSystemOwned: true,
      },
    };

    // Execute queries in parallel
    let [switches, routers, firewalls] = await Promise.all([
      Equipment.find(queries.switch).sort({ priceRange: 1 }),
      Equipment.find(queries.router).sort({ priceRange: 1 }),
      Equipment.find(queries.firewall).sort({ priceRange: 1 }),
    ]);

    // Fallback to public equipment if no system-owned found
    const findFallbackEquipment = async (originalQuery, category) => {
      const fallbackQuery = {
        ...originalQuery,
        isSystemOwned: false,
        isPublic: true,
      };
      return await Equipment.find(fallbackQuery).sort({ priceRange: 1 });
    };

    if (switches.length === 0) {
      switches = await findFallbackEquipment(queries.switch, "switch");
    }

    if (routers.length === 0) {
      routers = await findFallbackEquipment(queries.router, "router");
    }

    if (firewalls.length === 0) {
      firewalls = await findFallbackEquipment(queries.firewall, "firewall");
    }

    // Create recommendations only if equipment is found
    const recommendations = [];

    if (switches.length > 0) {
      recommendations.push({
        category: "switch",
        recommendedEquipment: switches[0]._id,
        quantity: switchRequirements.count,
        placement: "Core distribution",
        justification: `Based on ${design.requirements.totalUsers} users and ${design.requirements.bandwidth}Mbps bandwidth`,
        alternatives: switches.slice(1, 3).map((e) => e._id),
      });
    }

    if (routers.length > 0) {
      recommendations.push({
        category: "router",
        recommendedEquipment: routers[0]._id,
        quantity: routerRequirements.count,
        placement: "Network edge",
        justification: "For routing between network segments",
        alternatives: routers.slice(1, 3).map((e) => e._id),
      });
    }

    if (firewalls.length > 0) {
      recommendations.push({
        category: "firewall",
        recommendedEquipment: firewalls[0]._id,
        quantity: firewallRequirements.count,
        placement: "Between border router and ISP",
        justification: "For network security and traffic filtering",
        alternatives: firewalls.slice(1, 3).map((e) => e._id),
      });
    }

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No suitable equipment found for this design",
      });
    }

    const recommendation = new EquipmentRecommendation({
      designId: design._id,
      userId: req.user._id,
      recommendations,
    });

    await recommendation.save();

    const populatedRecommendation = await EquipmentRecommendation.findById(
      recommendation._id
    )
      .populate({
        path: "recommendations.recommendedEquipment",
        model: "Equipment",
        select: "manufacturer model imageUrl specs typicalUseCase",
      })
      .populate({
        path: "recommendations.alternatives",
        model: "Equipment",
        select: "manufacturer model imageUrl specs typicalUseCase",
      });

    res.json({
      success: true,
      data: populatedRecommendation,
    });
  } catch (error) {
    console.error("Recommendation generation failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
*/

const getEquipmentRecommendations = asyncHandler(async (req, res) => {
  try {
    console.log("Fetching design:", req.params.designId);
    const design = await NetworkDesign.findById(req.params.designId);

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Network design was not found",
      });
    }

    // Get requirements
    console.log("Calculating switch needs");
    const switchRequirements = calculateSwitchNeeds(design);
    console.log("Switch requirements:", switchRequirements);
    const routerRequirements = calculateRouterNeeds(design);
    console.log("Router requirements:", routerRequirements);
    const firewallRequirements = calculateFirewallNeeds(design);
    console.log("Firewall requirements:", firewallRequirements);

    // Helper function to find equipment combinations
    const findSwitchCombinations = async (requiredPorts, portSpeed) => {
      // First try to find single switch that meets requirements
      let query = {
        category: "switch",
        "specs.ports": { $gte: requiredPorts },
        "specs.portSpeed": portSpeed,
        isSystemOwned: true,
      };

      let switches = await Equipment.find(query).sort({ priceRange: 1 });

      if (switches.length > 0) {
        return {
          equipment: switches[0]._id,
          quantity: 1,
          alternatives: switches.slice(1, 3).map((e) => e._id),
        };
      }

      // If no single switch found, look for combinations of smaller switches
      query = {
        category: "switch",
        "specs.portSpeed": portSpeed,
        isSystemOwned: true,
      };

      const allSwitches = await Equipment.find(query).sort({
        "specs.ports": -1,
        priceRange: 1,
      });

      if (allSwitches.length === 0) {
        return null;
      }

      // Find most efficient combination
      let remainingPorts = requiredPorts;
      const selectedSwitches = [];
      let alternativeCombinations = [];

      for (const switchItem of allSwitches) {
        const ports = switchItem.specs.ports;
        const count = Math.ceil(remainingPorts / ports);

        if (count * ports >= remainingPorts) {
          selectedSwitches.push({
            equipment: switchItem._id,
            quantity: count,
          });
          remainingPorts = 0;
          break;
        }
      }

      if (remainingPorts > 0) {
        return null; // Couldn't find suitable combination
      }

      // For alternatives, suggest different models with similar total capacity
      if (allSwitches.length > 1) {
        alternativeCombinations = allSwitches.slice(1, 3).map((switchItem) => ({
          equipment: switchItem._id,
          quantity: Math.ceil(requiredPorts / switchItem.specs.ports),
        }));
      }

      return {
        equipment: selectedSwitches[0].equipment,
        quantity: selectedSwitches[0].quantity,
        alternatives: alternativeCombinations.map((c) => c.equipment),
      };
    };

    // Build queries for routers and firewalls (unchanged)
    const queries = {
      router: {
        category: "router",
        "specs.ports": { $gte: routerRequirements.ports },
        "specs.portSpeed": routerRequirements.speed,
        isSystemOwned: true,
      },
      firewall: {
        category: "firewall",
        "specs.ports": { $gte: firewallRequirements.ports },
        "specs.portSpeed": firewallRequirements.speed,
        isSystemOwned: true,
      },
    };

    // Execute queries in parallel
    const [switchCombo, routers, firewalls] = await Promise.all([
      findSwitchCombinations(
        switchRequirements.ports,
        switchRequirements.speed
      ),
      Equipment.find(queries.router).sort({ priceRange: 1 }),
      Equipment.find(queries.firewall).sort({ priceRange: 1 }),
    ]);

    // Fallback to public equipment if no system-owned found (for routers and firewalls)
    const findFallbackEquipment = async (originalQuery, category) => {
      const fallbackQuery = {
        ...originalQuery,
        isSystemOwned: false,
        isPublic: true,
      };
      return await Equipment.find(fallbackQuery).sort({ priceRange: 1 });
    };

    let publicRouters = [];
    if (routers.length === 0) {
      publicRouters = await findFallbackEquipment(queries.router, "router");
    }

    let publicFirewalls = [];
    if (firewalls.length === 0) {
      publicFirewalls = await findFallbackEquipment(
        queries.firewall,
        "firewall"
      );
    }

    // Create recommendations
    const recommendations = [];

    // Switch recommendation
    if (switchCombo) {
      recommendations.push({
        category: "switch",
        recommendedEquipment: switchCombo.equipment,
        quantity: switchCombo.quantity,
        placement: "Core distribution",
        justification: `Based on ${design.requirements.totalUsers} users and ${design.requirements.bandwidth}Mbps bandwidth`,
        alternatives: switchCombo.alternatives,
      });
    }

    // Router recommendation
    const routerOptions = routers.length > 0 ? routers : publicRouters;
    if (routerOptions.length > 0) {
      recommendations.push({
        category: "router",
        recommendedEquipment: routerOptions[0]._id,
        quantity: routerRequirements.count,
        placement: "Network edge",
        justification: "For routing between network segments",
        alternatives: routerOptions.slice(1, 3).map((e) => e._id),
      });
    }

    // Firewall recommendation
    const firewallOptions = firewalls.length > 0 ? firewalls : publicFirewalls;
    if (firewallOptions.length > 0) {
      recommendations.push({
        category: "firewall",
        recommendedEquipment: firewallOptions[0]._id,
        quantity: firewallRequirements.count,
        placement: "Between border router and ISP",
        justification: "For network security and traffic filtering",
        alternatives: firewallOptions.slice(1, 3).map((e) => e._id),
      });
    }

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No suitable equipment found for this design",
      });
    }

    const recommendation = new EquipmentRecommendation({
      designId: design._id,
      userId: req.user._id,
      recommendations,
    });

    await recommendation.save();

    const populatedRecommendation = await EquipmentRecommendation.findById(
      recommendation._id
    )
      .populate({
        path: "recommendations.recommendedEquipment",
        model: "Equipment",
        select: "manufacturer model imageUrl specs typicalUseCase",
      })
      .populate({
        path: "recommendations.alternatives",
        model: "Equipment",
        select: "manufacturer model imageUrl specs typicalUseCase",
      });

    res.json({
      success: true,
      data: populatedRecommendation,
    });
  } catch (error) {
    console.error("Recommendation generation failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
  createSystemEquipment,
  getAllEquipment,
  getEquipment,
  getUserEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentRecommendations,
  getEquipmentByCategory,
  getSimilarEquipment,
};
