const mongoose = require("mongoose");

const topologySchema = new mongoose.Schema({
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NetworkDesign",
    required: true,
  },
  nodes: [
    {
      id: String,
      label: String,
      type: {
        type: String,
        enum: ["switch", "router", "firewall", "server", "cloud", "user-group"],
      },
      level: Number,
      subnet: String,
      vlan: Number,
    },
  ],
  edges: [
    {
      from: String,
      to: String,
      label: String,
      bandwidth: String,
    },
  ],
  generatedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Topology", topologySchema);
