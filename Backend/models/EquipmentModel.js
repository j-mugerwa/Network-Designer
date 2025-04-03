const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["switch", "router", "firewall", "ap", "server"],
    },
    manufacturer: {
      type: String,
    },
    model: {
      type: String,
    },
    specs: {
      ports: Number,
      portSpeed: String, // e.g., "1G", "10G"
      throughput: String, // e.g., "100Gbps"
      wirelessStandard: String, // for APs
      vlanSupport: Boolean,
      layer: Number, // 2, 3, etc.
    },
    priceRange: {
      type: String,
    },
    typicalUseCase: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    datasheetUrl: {
      type: String,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    releaseYear: {
      type: Number,
    },
    endOfLife: {
      type: Date,
    },
    powerConsumption: {
      type: String,
    },
    dimensions: {
      type: String,
    },
    weight: {
      type: String,
    },
    warranty: {
      type: Number,
    }, // months
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
