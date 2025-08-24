const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const User = require("../models/UserModel");
const Team = require("../models/TeamModel");
const { validateDesignInput } = require("../middlewares/validateDesignInput");

// Design creation.
// @desc    Create a new network design
// @route   POST /api/designs
// @access  Private
const createDesign = asyncHandler(async (req, res) => {
  // Validate input with detailed error handling
  const { error, value: validatedData } = validateDesignInput(req.body);

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message.replace(/['"]+/g, ""),
    }));

    return res.status(400).json({
      success: false,
      error: "Network design validation failed",
      details: errorDetails,
      suggestion: "Please check all fields and try again",
    });
  }

  const { current = 0, limit, remaining } = req.designLimitInfo || {};
  const { teamId } = req.body; // Get teamId from request

  try {
    // Verify team membership if teamId is provided
    if (teamId) {
      const team = await Team.findOne({
        _id: teamId,
        "members.userId": req.user.uid,
      });

      if (!team) {
        return res.status(403).json({
          success: false,
          error: "You are not a member of this team",
        });
      }
    }

    // Create design with validated data
    const design = await NetworkDesign.create({
      userId: req.user._id,
      teamId: teamId || null,
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

    if (teamId) {
      // Also add the design to the team's designs array
      const team = await Team.findById(teamId);
      if (team && !team.designs.includes(design._id)) {
        team.designs.push(design._id);
        await team.save();
      }
    }

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
        teamId: design.teamId,
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

// @desc    Handle real-time design updates
// @access  Private (Socket)

const handleDesignUpdate = async (io, socket) => {
  return async ({ teamId, designId, changes }) => {
    try {
      const NetworkDesign = require("../models/NetworkDesignModel");

      // Verify team membership and update lastModified
      const team = await Team.findOneAndUpdate(
        {
          _id: teamId,
          "members.userId": socket.user.id,
        },
        {
          $set: {
            lastModified: {
              by: socket.user.id,
              at: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!team) {
        throw new Error("Not a member of this team");
      }

      // Validate and save design changes
      const updatedDesign = await NetworkDesign.findOneAndUpdate(
        { _id: designId, teamId },
        {
          $set: changes,
          $inc: { version: 1 },
          lastModified: new Date(),
        },
        { new: true }
      );

      if (!updatedDesign) {
        throw new Error("Design not found");
      }

      // Broadcast to team members
      io.to(`team_${teamId}`).emit("designUpdated", {
        designId,
        changes: updatedDesign,
        updatedBy: {
          id: socket.user.id,
          email: socket.user.email,
          name: socket.user.name,
        },
        teamLastModified: team.lastModified,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Design update error:", error);
      socket.emit("designUpdateError", {
        error: error.message,
        designId,
        timestamp: new Date(),
      });
    }
  };
};

// @desc    Handle design locking for collaboration
// @access  Private (Socket)
const handleDesignLock = async (io) => {
  return async ({ designId, isLocked }, socket) => {
    try {
      const design = await NetworkDesign.findOne({
        _id: designId,
        $or: [
          { userId: socket.user.id },
          { "collaborators.userId": socket.user.id },
        ],
      });

      if (!design) {
        throw new Error("Design not found or no permission");
      }

      // Update lock status
      design.isLocked = isLocked;
      design.lockedBy = isLocked ? socket.user.id : null;
      await design.save();

      // Notify all users viewing this design
      io.to(`design_${designId}`).emit("designLockChanged", {
        designId,
        isLocked,
        lockedBy: isLocked ? socket.user.email : null,
      });

      return { success: true };
    } catch (error) {
      console.error("Design lock error:", error);
      socket.emit("designLockError", { error: error.message });
    }
  };
};

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

  // Get user's team IDs first
  const userTeamIds = await getUsersTeamIds(req.user.uid);

  const design = await NetworkDesign.findOne({
    _id: req.params.id,
    $or: [
      { userId: req.user._id }, // User's own designs
      { teamId: { $in: userTeamIds } }, // Team designs user has access to
    ],
  });

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found or no permission",
    });
  }

  // For both personal and team designs, allow updates via REST API
  const { designName, description, isExistingNetwork, requirements } = req.body;

  const updatedDesign = await NetworkDesign.findByIdAndUpdate(
    req.params.id,
    {
      designName,
      description,
      isExistingNetwork,
      requirements,
      $inc: { version: 1 },
      lastModified: new Date(),
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Design updated successfully",
    data: {
      design: updatedDesign,
      changes: updatedDesign.modifiedPaths(),
      lastModified: updatedDesign.lastModified,
    },
  });
});

// New function to get designs for a team
// @desc    Get designs for a team
// @route   GET /api/designs/team/:teamId
// @access  Private (Team members only)
const getTeamDesigns = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { status, limit, page, search } = req.query;

  // Verify team membership
  const team = await Team.findOne({
    _id: teamId,
    "members.userId": req.user.uid,
  });

  if (!team) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this team",
    });
  }

  const query = { teamId };

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
    populate: {
      path: "userId",
      select: "name email",
    },
    lean: true,
    leanWithId: false,
  };

  try {
    const result = await NetworkDesign.paginate(query, options);

    const designs = result.docs.map((design) => ({
      ...design,
      deviceCount: 0,
      createdBy: design.userId, // Include creator info
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
    console.error("Error fetching team designs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch team designs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Assign a design to a team
// @desc    Assign design to team
// @route   PUT /api/designs/:id/assign-to-team
// @access  Private (Design owner or team admin)
/*
const assignDesignToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teamId } = req.body;

  // Verify design exists and user owns it
  const design = await NetworkDesign.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found or you don't have permission",
    });
  }

  // Verify team membership
  const team = await Team.findOne({
    _id: teamId,
    "members.userId": req.user.uid,
  });

  if (!team) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this team",
    });
  }

  // Update design with team association
  design.teamId = teamId;
  design.lastModified = new Date();
  design.version += 1;

  await design.save();

  res.json({
    success: true,
    message: "Design assigned to team successfully",
    data: {
      designId: design._id,
      teamId: design.teamId,
      teamName: team.name,
    },
  });
});
*/

const assignDesignToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teamId } = req.body;

  // Verify design exists and user owns it
  const design = await NetworkDesign.findOne({
    _id: id,
    userId: req.user._id,
  });

  if (!design) {
    return res.status(404).json({
      success: false,
      error: "Design not found or you don't have permission",
    });
  }

  // Verify team membership
  const team = await Team.findOne({
    _id: teamId,
    "members.userId": req.user.uid,
  });

  if (!team) {
    return res.status(403).json({
      success: false,
      error: "You are not a member of this team",
    });
  }

  // Update design with team association
  design.teamId = teamId;
  design.lastModified = new Date();
  design.version += 1;

  await design.save();

  // Update team's designs array
  if (!team.designs.includes(design._id)) {
    team.designs.push(design._id);
    await team.save();
  }

  res.json({
    success: true,
    message: "Design assigned to team successfully",
    data: {
      designId: design._id,
      teamId: design.teamId,
      teamName: team.name,
    },
  });
});

// Remove design from team
const removeDesignFromTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const design = await NetworkDesign.findOne({
    _id: id,
    userId: req.user._id, // Only owner can remove from team
  });

  if (!design || !design.teamId) {
    return res.status(404).json({
      success: false,
      error: "Design not found or not assigned to a team",
    });
  }

  // Remove from team's designs array
  const team = await Team.findById(design.teamId);
  if (team) {
    team.designs = team.designs.filter(
      (designId) => designId.toString() !== design._id.toString()
    );
    await team.save();
  }

  // Remove team association from design
  design.teamId = null;
  design.lastModified = new Date();
  design.version += 1;
  await design.save();

  res.json({
    success: true,
    message: "Design removed from team successfully",
    data: {
      designId: design._id,
    },
  });
});

// @desc    Generate network design report
// @route   POST /api/designs/:id/report
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  // Get user's team IDs first
  const userTeamIds = await getUsersTeamIds(req.user.uid);

  const design = await NetworkDesign.findOne({
    _id: req.params.id,
    $or: [
      { userId: req.user._id }, // User's own designs
      { teamId: { $in: userTeamIds } }, // Team designs user has access to
    ],
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

  // Get user's team IDs first
  const userTeamIds = await getUsersTeamIds(req.user.uid);

  // Build the base query.
  const baseQuery = {
    $or: [
      { userId: req.user._id }, // User's own designs
      { teamId: { $in: userTeamIds } }, // Team designs user has access to
    ],
  };

  // Add status filter if provided
  if (status) {
    baseQuery.designStatus = status;
  }

  // Handle search separately
  let finalQuery = { ...baseQuery };
  if (search) {
    finalQuery = {
      $and: [
        baseQuery,
        {
          $or: [
            { designName: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };
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
    lean: true,
    leanWithId: false,
  };

  try {
    const result = await NetworkDesign.paginate(finalQuery, options);

    const designs = result.docs.map((design) => ({
      ...design,
      deviceCount: 0,
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
      error: "Failed to fetch the designs",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get single design
// @route   GET /api/designs/:id
// @access  Private

/*
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
*/

// @desc    Get single design
// @route   GET /api/designs/:id
// @access  Private
const getDesign = asyncHandler(async (req, res) => {
  try {
    // Get user's team IDs first
    const userTeamIds = await getUsersTeamIds(req.user.uid);

    const design = await NetworkDesign.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id }, // User's own designs
        { teamId: { $in: userTeamIds } }, // Team designs user has access to
      ],
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
/*
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
  //If the design is found
  if (design) {
    console.log(design.designName, " Was found and Archived Successfully");
  }
  //If there is no design.
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

  console.log();
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
*/

const archiveDesign = asyncHandler(async (req, res) => {
  // Get user's team IDs first
  const userTeamIds = await getUsersTeamIds(req.user.uid);

  const design = await NetworkDesign.findOneAndUpdate(
    {
      _id: req.params.id,
      $or: [
        { userId: req.user._id }, // User's own designs
        { teamId: { $in: userTeamIds } }, // Team designs user has access to
      ],
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

  // Decrement user's active design count only if they own it
  if (design.userId.toString() === req.user._id.toString()) {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "subscription.designCount": -1 },
    });
  }

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

// Helper function to get user's team IDs
async function getUsersTeamIds(userUid) {
  const teams = await Team.find({
    "members.userId": userUid,
  }).select("_id");

  return teams.map((team) => team._id);
}

module.exports = {
  createDesign,
  updateDesign,
  generateReport,
  getUserDesigns,
  getDesign,
  getTeamDesigns,
  assignDesignToTeam,
  removeDesignFromTeam,
  archiveDesign,
  //Socket-Related
  handleDesignUpdate,
  handleDesignLock,
};
