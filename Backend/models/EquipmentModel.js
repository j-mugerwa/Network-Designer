const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["switch", "router", "firewall", "ap", "server"],
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    specs: {
      // Common specifications
      ports: Number,
      portSpeed: String, // e.g., "1G", "10G"
      throughput: String, // e.g., "100Gbps"
      wirelessStandard: String, // for APs
      vlanSupport: Boolean,
      layer: Number, // 2, 3, etc.
      powerConsumption: String, // e.g., "50W"

      // Network-specific attributes
      managementIp: String, // For devices that support management interfaces
      defaultGateway: String,
      supportsIPv6: Boolean,

      // Physical attributes
      dimensions: String, // e.g., "1.75 x 19 x 10 in"
      weight: String, // e.g., "5.5 lbs"
      rackUnitSize: Number, // e.g., 1U, 2U
      formFactor: {
        type: String,
        enum: ["desktop", "rackmount", "blade", "modular", "other"],
      },

      // Additional technical specs
      processor: String, // For servers/firewalls
      memory: String, // e.g., "8GB"
      storage: String, // e.g., "500GB SSD"
      operatingSystem: String,

      // Environmental specs
      operatingTemperature: String, // e.g., "0°C to 40°C"
      humidityRange: String, // e.g., "10% to 90%"
    },
    priceRange: {
      type: String,
      enum: ["$", "$$", "$$$", "$$$$"],
      default: "$$",
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
    warranty: {
      months: Number,
      type: {
        type: String,
        enum: ["limited", "lifetime", "extended"],
        default: "limited",
      },
    },
    // New fields to track ownership and visibility
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isSystemOwned: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    // Physical location tracking
    location: {
      rack: String,
      position: Number,
      room: String,
      building: String,
      site: String,
    },
    // Network configuration (for deployed devices)
    networkConfig: {
      ipAddress: String,
      subnetMask: String,
      macAddress: String,
      dnsServers: [String],
      ntpServers: [String],
    },
    // Maintenance information
    maintenance: {
      lastMaintained: Date,
      maintenanceInterval: Number, // in days
      maintenanceNotes: String,
    },
    //Keep track of Config applications.
    configurations: [
      {
        configTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ConfigurationTemplate",
          required: true,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        appliedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "active", "failed", "rolled-back"],
          default: "pending",
        },
        isCurrent: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for better performance
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ manufacturer: 1 });
equipmentSchema.index({ model: 1 });
equipmentSchema.index({ createdBy: 1 });
equipmentSchema.index({ isSystemOwned: 1 });
equipmentSchema.index({ isPublic: 1 });
equipmentSchema.index({ "specs.managementIp": 1 }, { sparse: true });
equipmentSchema.index({ "networkConfig.ipAddress": 1 }, { sparse: true });

// Virtual for formatted display name
equipmentSchema.virtual("displayName").get(function () {
  return `${this.manufacturer} ${this.model}`;
});

// Virtual for warranty display
equipmentSchema.virtual("warrantyDisplay").get(function () {
  if (!this.warranty) return "No warranty";
  return `${this.warranty.months} months (${this.warranty.type})`;
});

// Middleware to handle IP addresses
equipmentSchema.pre("save", function (next) {
  if (this.specs.managementIp) {
    // Validate IP format if provided
    if (!isValidIP(this.specs.managementIp)) {
      throw new Error("Invalid management IP address format");
    }
  }
  if (this.networkConfig?.ipAddress) {
    // Validate IP format if provided
    if (!isValidIP(this.networkConfig.ipAddress)) {
      throw new Error("Invalid network IP address format");
    }
  }
  next();
});

// Helper function for IP validation
function isValidIP(ip) {
  // Simple IP validation - replace with more robust validation if needed
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip
  );
}

module.exports = mongoose.model("Equipment", equipmentSchema);
