const mongoose = require("mongoose");

const networkDesignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    designName: {
      type: String,
      required: true,
    },
    isExistingNetwork: {
      type: Boolean,
      default: false,
    },
    existingNetworkDetails: {
      currentTopology: String,
      currentIssues: [String],
      currentIPScheme: String,
    },
    requirements: {
      totalUsers: {
        type: String,
        enum: ["1-50", "51-200", "201-500", "500+"],
      },
      wiredUsers: {
        type: Number,
      },
      wirelessUsers: {
        type: Number,
      },
      networkSegmentation: {
        type: Boolean,
        default: false,
      },
      segments: [
        {
          name: String,
          type: { type: String, enum: ["department", "function", "security"] },
          users: Number,
          bandwidthPriority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
        },
      ],
      bandwidth: {
        type: Number,
      }, // in Mbps
      cloudServices: {
        type: Boolean,
        default: false,
      },
      localERP: {
        type: Boolean,
        default: false,
      },
      dhcpServer: {
        type: Boolean,
        default: false,
      },
      dnsServer: {
        type: Boolean,
        default: false,
      },
      preferredPrivateIP: {
        type: String,
        enum: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
      },
      publicIPs: {
        type: Number,
        default: 0,
      },
      physicalServers: {
        type: Number,
        default: 0,
      },
      dedicatedFirewall: {
        type: Boolean,
        default: false,
      },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NetworkDesign", networkDesignSchema);
