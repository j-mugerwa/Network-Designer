const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const User = require("../models/UserModel");
const { validateDesignInput } = require("../middlewares/validateDesignInput");
//const { checkDesignLimit } = require("../middleware/designMiddleware");

// @desc    Create a new network design
// @route   POST /api/designs
// @access  Private
const createDesign = asyncHandler(async (req, res) => {
  // Validate input with detailed error handling
  const { error, value: validatedData } = validateDesignInput(req.body);

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message.replace(/['"]+/g, ""), // Remove quotes from error messages
    }));

    return res.status(400).json({
      success: false,
      error: "Network design validation failed",
      details: errorDetails,
      suggestion: "Please check all fields and try again",
    });
  }

  // Middleware already checked limits - use the info it attached
  const { current = 0, limit, remaining } = req.designLimitInfo || {};

  try {
    // Create design with validated data
    const design = await NetworkDesign.create({
      userId: req.user._id,
      designName: validatedData.designName,
      description: validatedData.description,
      isExistingNetwork: validatedData.isExistingNetwork,
      existingNetworkDetails: validatedData.isExistingNetwork
        ? validatedData.existingNetworkDetails
        : undefined,
      requirements: validatedData.requirements,
      designStatus: "draft",
      version: 1,
    });

    // Update user's design count and last activity
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { "subscription.designCount": 1 },
        $set: { lastActivity: new Date() },
      },
      { new: true }
    );

    // Prepare response data
    const responseData = {
      design: {
        id: design._id,
        name: design.designName,
        status: design.designStatus,
        createdAt: design.createdAt,
        version: design.version,
      },
      limits: {
        current: current + 1,
        limit,
        remaining: remaining - 1,
      },
      actions: [
        {
          action: "view",
          method: "GET",
          url: `https://localhost/api/networkdesign/${design._id}`,
        },
        {
          action: "update",
          method: "PUT",
          url: `https://localhost/api/networkdesign/${design._id}`,
        },
      ],
    };

    res.status(201).json({
      success: true,
      message: "Network design created successfully",
      data: responseData,
      metadata: {
        resource: "network-design",
        operation: "create",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Design creation error:", error);

    // Handle duplicate design names
    if (error.code === 11000 && error.keyPattern?.designName) {
      return res.status(409).json({
        success: false,
        error: "Design name already exists",
        suggestion: "Please choose a different design name",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create network design",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      reference: `TRACE-${Date.now()}`,
    });
  }
});

// @desc    Update a network design
// @route   PUT /api/designs/:id
// @access  Private
const updateDesign = asyncHandler(async (req, res) => {
  const { error } = validateDesignInput(req.body, true);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  const design = await NetworkDesign.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found or you don't have permission to edit it",
    });
  }

  // Prevent updating archived designs
  if (design.designStatus === "archived") {
    return res.status(400).json({
      success: false,
      error: "Archived designs cannot be modified",
    });
  }

  const { designName, description, isExistingNetwork, requirements } = req.body;

  // Update design
  const updatedDesign = await NetworkDesign.findByIdAndUpdate(
    req.params.id,
    {
      designName,
      description,
      isExistingNetwork,
      requirements,
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Design updated successfully",
    data: {
      design: updatedDesign,
      changes: updatedDesign.modifiedPaths(),
    },
  });
});

// @desc    Generate network design report
// @route   POST /api/designs/:id/report
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  const design = await NetworkDesign.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("devices");

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found or you don't have permission to access it",
    });
  }

  // Calculate IP scheme
  const ipScheme = calculateIPScheme(
    design.requirements.ipScheme.private,
    design.requirements.segments
  );

  // Generate equipment recommendations
  const recommendations = generateRecommendations(design);

  // Create comprehensive report
  const report = {
    designId: design._id,
    designName: design.designName,
    summary: {
      totalUsers: design.requirements.totalUsers,
      wiredUsers: design.requirements.wiredUsers,
      wirelessUsers: design.requirements.wirelessUsers,
      bandwidthRequirements: design.requirements.bandwidth,
    },
    networkArchitecture: {
      segmentation: design.requirements.networkSegmentation,
      segments: design.requirements.segments,
      ipScheme,
      security: design.requirements.securityRequirements,
    },
    equipmentRecommendations: recommendations,
    implementationPhases: generateImplementationPlan(design),
    estimatedCostRange: estimateCost(design),
    createdAt: new Date(),
  };

  // Save report to design (in a real app, you'd save to a Report model)
  design.reports.push(report);
  await design.save();

  // In production, you'd generate a PDF and store it
  const reportUrl = `/api/reports/${design._id}/${Date.now()}.pdf`;

  res.json({
    success: true,
    message: "Report generated successfully",
    data: {
      report,
      downloadUrl: reportUrl,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    },
  });
});

// @desc    Get all designs for authenticated user
// @route   GET /api/designs
// @access  Private
const getUserDesigns = asyncHandler(async (req, res) => {
  const { status, limit, page, search } = req.query;
  const query = { userId: req.user._id };

  if (status) {
    query.designStatus = status;
  }

  if (search) {
    query.$or = [
      { designName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const options = {
    limit: parseInt(limit) || 10,
    page: parseInt(page) || 1,
    sort: { updatedAt: -1 },
    select: "-devices -reports",
    collation: {
      locale: "en",
      strength: 2,
    },
    // Force plain objects without virtuals
    lean: true,
    leanWithId: false,
  };

  try {
    const result = await NetworkDesign.paginate(query, options);

    // Since we're using lean, we need to manually add deviceCount if needed
    const designs = result.docs.map((design) => ({
      ...design,
      deviceCount: 0, // Since we excluded devices, we can't calculate this
    }));

    res.json({
      success: true,
      data: designs,
      pagination: {
        total: result.totalDocs,
        limit: result.limit,
        page: result.page,
        pages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch designs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get single design
// @route   GET /api/designs/:id
// @access  Private

const getDesign = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate("devices")
      .lean();

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Design not found or you don't have permission to access it",
      });
    }

    // Manually add deviceCount since we're using lean
    design.deviceCount = design.devices ? design.devices.length : 0;

    res.json({
      success: true,
      data: design,
    });
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch design",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Archive a design
// @route   PUT /api/designs/:id/archive
// @access  Private
const archiveDesign = asyncHandler(async (req, res) => {
  const design = await NetworkDesign.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id,
      designStatus: { $ne: "archived" },
    },
    { designStatus: "archived" },
    { new: true }
  );

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found, already archived, or you don't have permission",
    });
  }

  // Decrement user's active design count
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { "subscription.designCount": -1 },
  });

  res.json({
    success: true,
    message: "Design archived successfully",
    data: {
      designId: design._id,
      designName: design.designName,
      status: design.designStatus,
    },
  });
});

// Helper functions
function calculateIPScheme(baseIP, segments) {
  // Implement IP subnet calculation logic
  return {
    baseNetwork: baseIP,
    subnets: segments.map((segment) => ({
      name: segment.name,
      network: `Derived subnet for ${segment.name}`,
      range: "Calculated IP range",
      gateway: "Calculated gateway",
    })),
  };
}

function generateRecommendations(design) {
  // Implement equipment recommendation logic
  return {
    routers: [],
    switches: [],
    accessPoints: [],
    servers: [],
    securityDevices: [],
  };
}

function generateImplementationPlan(design) {
  // Break down implementation into phases
  return [
    {
      phase: 1,
      tasks: ["Core network setup", "Security appliance installation"],
      duration: "2 weeks",
    },
    {
      phase: 2,
      tasks: ["Segment configuration", "Wireless deployment"],
      duration: "1 week",
    },
  ];
}

function estimateCost(design) {
  // Simple estimation based on requirements
  let base = 0;
  if (design.requirements.totalUsers === "1-50") base = 5000;
  else if (design.requirements.totalUsers === "51-200") base = 15000;
  else if (design.requirements.totalUsers === "201-500") base = 35000;
  else base = 75000;

  // Adjust for security requirements
  if (design.requirements.securityRequirements.firewall === "enterprise")
    base *= 1.5;
  if (design.requirements.securityRequirements.ips) base += 5000;

  return {
    low: base * 0.8,
    high: base * 1.2,
    currency: "USD",
  };
}

module.exports = {
  createDesign,
  updateDesign,
  generateReport,
  getUserDesigns,
  getDesign,
  archiveDesign,
};
