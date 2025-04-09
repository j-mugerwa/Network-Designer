const mongoose = require("mongoose");

const topologySchema = new mongoose.Schema({
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NetworkDesign",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nodes: [
    {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: [
          "switch",
          "router",
          "firewall",
          "server",
          "cloud",
          "user-group",
          "wan",
          "internet",
          "wireless-ap",
        ],
        required: true,
      },
      level: {
        type: Number,
        min: 1,
        max: 3,
        default: 1,
      },
      subnet: String,
      vlan: Number,
      ipAddress: String,
      model: String,
      interfaces: [
        {
          name: String,
          ip: String,
          connectedTo: String,
        },
      ],
      position: {
        x: Number,
        y: Number,
      },
    },
  ],
  edges: [
    {
      from: {
        type: String,
        required: true,
      },
      to: {
        type: String,
        required: true,
      },
      label: String,
      bandwidth: String,
      type: {
        type: String,
        enum: ["ethernet", "fiber", "wireless", "vpn"],
        default: "ethernet",
      },
      latency: String,
      protocol: String,
    },
  ],
  layers: {
    type: [String],
    default: ["core", "distribution", "access"],
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

topologySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Topology", topologySchema);
