const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

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
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isExistingNetwork: {
      type: Boolean,
      default: false,
    },
    existingNetworkDetails: {
      currentTopology: {
        type: String,
        enum: ["star", "bus", "ring", "mesh", "hybrid", "other"],
      },
      currentIssues: [
        {
          type: String,
          enum: [
            "bandwidth",
            "latency",
            "security",
            "reliability",
            "scalability",
            "management",
          ],
        },
      ],
      currentIPScheme: String,
      currentDevices: [
        {
          type: {
            type: String,
            enum: ["router", "switch", "firewall", "server", "access-point"],
          },
          model: String,
          quantity: Number,
        },
      ],
    },
    requirements: {
      totalUsers: {
        type: String,
        enum: ["1-50", "51-200", "201-500", "500+"],
        required: true,
      },
      wiredUsers: {
        type: Number,
        min: 0,
        default: 0,
      },
      wirelessUsers: {
        type: Number,
        min: 0,
        default: 0,
      },
      networkSegmentation: {
        type: Boolean,
        default: false,
      },
      segments: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          type: {
            type: String,
            enum: ["department", "function", "security", "guest", "iot"],
          },
          users: {
            type: Number,
            min: 1,
            required: true,
          },
          bandwidthPriority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
          isolationLevel: {
            type: String,
            enum: ["none", "vlans", "physical", "full"],
            default: "none",
          },
        },
      ],
      bandwidth: {
        upload: { type: Number, min: 1 }, // in Mbps
        download: { type: Number, min: 1 }, // in Mbps
        symmetric: { type: Boolean, default: false },
      },
      services: {
        cloud: [
          {
            type: String,
            enum: ["saas", "iaas", "paas", "storage", "backup"],
          },
        ],
        onPremise: [
          {
            type: String,
            enum: ["erp", "crm", "fileserver", "email", "database"],
          },
        ],
        network: [
          {
            type: String,
            enum: ["dhcp", "dns", "vpn", "proxy", "load-balancing"],
          },
        ],
      },
      ipScheme: {
        private: {
          type: String,
          enum: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
          default: "192.168.0.0/16",
        },
        publicIPs: {
          type: Number,
          min: 0,
          default: 0,
        },
        ipv6: {
          type: Boolean,
          default: false,
        },
      },
      securityRequirements: {
        firewall: {
          type: String,
          enum: ["none", "basic", "enterprise", "utm"],
          default: "basic",
        },
        ids: { type: Boolean, default: false },
        ips: { type: Boolean, default: false },
        contentFiltering: { type: Boolean, default: false },
        remoteAccess: {
          type: String,
          enum: ["none", "vpn", "rdp", "citrix"],
          default: "none",
        },
      },
      redundancy: {
        internet: { type: Boolean, default: false },
        coreSwitching: { type: Boolean, default: false },
        power: { type: Boolean, default: false },
      },
      budgetRange: {
        type: String,
        enum: ["low", "medium", "high", "unlimited"],
        default: "medium",
      },
    },
    designStatus: {
      type: String,
      enum: ["draft", "active", "archived", "template"],
      default: "draft",
    },
    lastModified: { type: Date },
    version: { type: Number, default: 1 },
    isTemplate: { type: Boolean, default: false },
    devices: [
      {
        equipmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
      },
    ],
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NetworkReport",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total devices count
networkDesignSchema.virtual("deviceCount").get(function () {
  if (!this.devices || !Array.isArray(this.devices)) {
    return 0;
  }
  return this.devices.length;
});

// Add pagination plugin
networkDesignSchema.plugin(mongoosePaginate);
// Add index for better query performance
networkDesignSchema.index({ userId: 1, designName: 1 }, { unique: true });
networkDesignSchema.index({ userId: 1, designStatus: 1 });

// Middleware to update lastModified before save
networkDesignSchema.pre("save", function (next) {
  this.lastModified = new Date();
  if (this.isModified()) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model("NetworkDesign", networkDesignSchema);
