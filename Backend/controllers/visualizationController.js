const asyncHandler = require("express-async-handler");
const NetworkDesign = require("../models/NetworkDesignModel");
const NetworkTopology = require("../models/NetworkTopologyModel");
const IPCalculator = require("../services/ipCalculator");

// @desc    Generate network topology
// @route   POST /api/topology/:designId
// @access  Private
const generateTopology = asyncHandler(async (req, res) => {
  try {
    const design = await NetworkDesign.findOne({
      _id: req.params.designId,
      userId: req.user._id,
    }).populate("devices");

    if (!design) {
      return res.status(404).json({
        success: false,
        error: "Design not found or access denied",
      });
    }

    // Generate nodes and edges
    const nodes = generateNodes(design);
    const edges = generateEdges(design, nodes);

    const topology = new NetworkTopology({
      designId: design._id,
      userId: req.user._id,
      nodes,
      edges,
    });

    await topology.save();

    res.json({
      success: true,
      data: topology,
      visualizationUrl: `/api/visualization/${topology._id}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate topology",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get topology for a design
// @route   GET /api/topology/:designId
// @access  Private
const getTopology = asyncHandler(async (req, res) => {
  try {
    const topology = await NetworkTopology.findOne({
      designId: req.params.designId,
      userId: req.user._id,
    });

    if (!topology) {
      return res.status(404).json({
        success: false,
        error: "Topology not found",
      });
    }

    res.json({
      success: true,
      data: topology,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch the topology",
    });
  }
});

// Helper functions
function generateNodes(design) {
  const nodes = [];
  let nodeId = 1;

  // Core layer devices
  if (design.requirements.routers) {
    nodes.push({
      id: `R${nodeId++}`,
      label: "Core Router",
      type: "router",
      level: 1,
      model:
        design.devices.find((d) => d.type === "router")?.model || "ISR 4000",
      interfaces: [
        { name: "Gig0/0", ip: "", connectedTo: "" },
        { name: "Gig0/1", ip: "", connectedTo: "" },
      ],
    });
  }

  // Firewall if security requirements exist
  if (design.requirements.securityRequirements.firewall) {
    nodes.push({
      id: `FW${nodeId++}`,
      label: "Firewall",
      type: "firewall",
      level: 1,
      model:
        design.devices.find((d) => d.type === "firewall")?.model || "ASA 5500",
    });
  }

  // Distribution layer switches
  const distributionSwitches = design.requirements.networkSegmentation
    ? design.requirements.segments.length
    : 1;

  for (let i = 0; i < distributionSwitches; i++) {
    nodes.push({
      id: `DSW${nodeId++}`,
      label: `Dist Switch ${i + 1}`,
      type: "switch",
      level: 2,
      vlan: design.requirements.networkSegmentation
        ? design.requirements.segments[i].vlanId
        : null,
      model:
        design.devices.find((d) => d.type === "switch")?.model ||
        "Catalyst 9200",
    });
  }

  // Access layer switches
  const accessSwitches = Math.ceil(design.requirements.wiredUsers / 24);
  for (let i = 0; i < accessSwitches; i++) {
    nodes.push({
      id: `ASW${nodeId++}`,
      label: `Access Switch ${i + 1}`,
      type: "switch",
      level: 3,
      model:
        design.devices.find((d) => d.type === "switch")?.model ||
        "Catalyst 2960",
    });
  }

  // Wireless Access Points
  const aps = Math.ceil(design.requirements.wirelessUsers / 30);
  for (let i = 0; i < aps; i++) {
    nodes.push({
      id: `AP${nodeId++}`,
      label: `AP ${i + 1}`,
      type: "wireless-ap",
      level: 3,
      model:
        design.devices.find((d) => d.type === "access-point")?.model ||
        "AIR-CAP2702",
    });
  }

  // User groups
  nodes.push({
    id: `UG${nodeId++}`,
    label: `Wired Users (${design.requirements.wiredUsers})`,
    type: "user-group",
    level: 4,
  });

  nodes.push({
    id: `UG${nodeId++}`,
    label: `Wireless Users (${design.requirements.wirelessUsers})`,
    type: "user-group",
    level: 4,
  });

  // Internet/WAN connection
  nodes.push({
    id: `WAN${nodeId++}`,
    label: "Internet",
    type: "internet",
    level: 0,
  });

  return nodes;
}

function generateEdges(design, nodes) {
  const edges = [];
  const coreRouter = nodes.find((n) => n.type === "router");
  const firewall = nodes.find((n) => n.type === "firewall");
  const distSwitches = nodes.filter(
    (n) => n.type === "switch" && n.level === 2
  );
  const accessSwitches = nodes.filter(
    (n) => n.type === "switch" && n.level === 3
  );
  const aps = nodes.filter((n) => n.type === "wireless-ap");
  const userGroups = nodes.filter((n) => n.type === "user-group");
  const internet = nodes.find((n) => n.type === "internet");

  // Connect internet to firewall or router
  if (firewall) {
    edges.push({
      from: internet.id,
      to: firewall.id,
      label: `${design.requirements.bandwidth.download} Mbps`,
      type: "fiber",
      bandwidth: `${design.requirements.bandwidth.download} Mbps`,
    });

    edges.push({
      from: firewall.id,
      to: coreRouter.id,
      label: "LAN",
      type: "ethernet",
      bandwidth: "10 Gbps",
    });
  } else {
    edges.push({
      from: internet.id,
      to: coreRouter.id,
      label: `${design.requirements.bandwidth.download} Mbps`,
      type: "fiber",
      bandwidth: `${design.requirements.bandwidth.download} Mbps`,
    });
  }

  // Connect core to distribution
  distSwitches.forEach((sw) => {
    edges.push({
      from: coreRouter.id,
      to: sw.id,
      label: "Trunk",
      type: "fiber",
      bandwidth: "10 Gbps",
    });
  });

  // Connect distribution to access switches
  distSwitches.forEach((distSw, i) => {
    const accessSwForDist = accessSwitches.slice(
      i * Math.ceil(accessSwitches.length / distSwitches.length),
      (i + 1) * Math.ceil(accessSwitches.length / distSwitches.length)
    );

    accessSwForDist.forEach((accSw) => {
      edges.push({
        from: distSw.id,
        to: accSw.id,
        label: `VLAN ${distSw.vlan || 1}`,
        type: "ethernet",
        bandwidth: "1 Gbps",
      });
    });
  });

  // Connect access switches to user groups
  edges.push({
    from: accessSwitches[0].id,
    to: userGroups.find((ug) => ug.label.includes("Wired")).id,
    label: "Access",
    type: "ethernet",
    bandwidth: "100 Mbps",
  });

  // Connect APs to distribution switches
  aps.forEach((ap) => {
    edges.push({
      from: distSwitches[0].id,
      to: ap.id,
      label: "Wireless Backhaul",
      type: "ethernet",
      bandwidth: "1 Gbps",
    });
  });

  // Connect APs to wireless users
  edges.push({
    from: aps[0].id,
    to: userGroups.find((ug) => ug.label.includes("Wireless")).id,
    label: "Wi-Fi",
    type: "wireless",
    bandwidth: `${design.requirements.bandwidth.wireless || 300} Mbps`,
  });

  return edges;
}

// @desc    Render topology visualization
// @route   GET /api/visualization/:topologyId
// @access  Private
const renderTopology = asyncHandler(async (req, res) => {
  try {
    const topology = await NetworkTopology.findOne({
      _id: req.params.topologyId,
      userId: req.user._id,
    });

    if (!topology) {
      return res.status(404).json({
        success: false,
        error: "Topology not found",
      });
    }

    // Convert to format suitable for visualization libraries like Vis.js or D3.js
    const visualizationData = {
      nodes: topology.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        group: node.type,
        level: node.level,
        title: `
          Type: ${node.type}
          ${node.model ? `Model: ${node.model}` : ""}
          ${node.vlan ? `VLAN: ${node.vlan}` : ""}
          ${node.subnet ? `Subnet: ${node.subnet}` : ""}
        `,
      })),
      edges: topology.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        title: `
          Bandwidth: ${edge.bandwidth}
          Type: ${edge.type}
        `,
      })),
    };

    res.json({
      success: true,
      data: visualizationData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to render topology",
    });
  }
});

module.exports = {
  generateTopology,
  renderTopology,
  getTopology,
};
