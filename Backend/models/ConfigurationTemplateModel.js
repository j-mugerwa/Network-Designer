const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const variableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Variable name is required"],
    match: [
      /^[a-zA-Z0-9_]+$/,
      "Variable names can only contain alphanumeric characters and underscores",
    ],
  },
  description: {
    type: String,
    required: [true, "Variable description is required"],
  },
  defaultValue: {
    type: String,
    required: function () {
      return !this.required; // Default value is required if the variable isn't marked as required
    },
  },
  required: {
    type: Boolean,
    default: false,
  },
  validationRegex: {
    type: String,
    validate: {
      validator: function (v) {
        try {
          new RegExp(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: "Invalid regular expression",
    },
  },
  example: String,
  dataType: {
    type: String,
    enum: ["string", "number", "ip", "cidr", "boolean", "select"],
    default: "string",
  },
  options: {
    type: [String],
    required: function () {
      return this.dataType === "select";
    },
  },
  scope: {
    type: String,
    enum: ["global", "device", "interface"],
    default: "global",
  },
});

const configAttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const configTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Template name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    equipmentCategory: {
      type: String,
      enum: ["switch", "router", "firewall", "ap", "server"],
      required: [true, "Equipment category is required"],
      index: true,
    },
    specificDeviceModels: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return v && v.length <= 50;
          },
          message: "Model name must be between 1 and 50 characters",
        },
      },
    ],
    configSourceType: {
      type: String,
      enum: ["template", "file"],
      required: true,
      default: "template",
      index: true,
    },
    configFile: {
      type: configAttachmentSchema,
      required: function () {
        return this.configSourceType === "file";
      },
    },
    template: {
      type: String,
      required: function () {
        return this.configSourceType === "template";
      },
      validate: {
        validator: function (v) {
          if (this.configSourceType === "template") {
            const variableMatches = v.match(/\{\{([^}]+)\}\}/g) || [];
            const definedVars = this.variables.map((v) => v.name);
            return variableMatches.every((match) => {
              const varName = match.replace(/\{\{|\}\}/g, "");
              return definedVars.includes(varName);
            });
          }
          return true;
        },
        message: "Template contains undefined variables",
      },
    },
    fileConfigMetadata: {
      parser: {
        type: String,
        enum: ["text", "json", "xml", "binary", "auto"],
        default: "auto",
      },
      extractedVariables: [
        {
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
          lineNumber: {
            type: Number,
            min: 1,
          },
        },
      ],
    },
    vendor: {
      type: String,
      required: [true, "Vendor is required"],
      index: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      index: true,
    },
    configType: {
      type: String,
      enum: [
        "basic",
        "vlan",
        "routing",
        "security",
        "qos",
        "ha",
        "snmp",
        "ntp",
        "syslog",
        "interface",
        "system",
      ],
      required: [true, "Configuration type is required"],
      index: true,
    },
    variables: {
      type: [variableSchema],
      validate: {
        validator: function (v) {
          if (this.configSourceType === "template") {
            return v && v.length > 0;
          }
          return true;
        },
        message: "Template-based configurations require at least one variable",
      },
    },
    version: {
      type: String,
      default: "1.0.0",
      match: [/^\d+\.\d+\.\d+$/, "Version must be in semantic version format"],
    },
    tags: {
      type: [String],
      validate: {
        validator: function (v) {
          return !v || v.length <= 10;
        },
        message: "Cannot have more than 10 tags",
      },
    },
    compatibility: {
      osVersions: {
        type: [String],
        validate: {
          validator: function (v) {
            return !v || v.every((ver) => /^[\w\s\.-]+$/.test(ver)); // \s for spaces
          },
          message:
            "Invalid OS version format. Only letters, numbers, spaces, dots, and hyphens allowed",
        },
      },
      firmwareVersions: {
        type: [String],
        validate: {
          validator: function (v) {
            return !v || v.every((ver) => /^[\w\.-]+$/.test(ver));
          },
          message: "Invalid firmware version format",
        },
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystemTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    validationScript: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.length <= 5000;
        },
        message: "Validation script cannot exceed 5000 characters",
      },
    },
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    changeLog: [
      {
        version: {
          type: String,
          required: true,
        },
        changes: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    //Keep Track of the deployments to devices
    deployments: [
      {
        device: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Equipment",
          required: true,
        },
        deployedAt: {
          type: Date,
          default: Date.now,
        },
        deployedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "active", "failed", "rolled-back"],
          default: "active",
        },
        variables: {
          type: Map,
          of: String,
        },
        renderedConfig: String,
        notes: String,
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
    toObject: { virtuals: true },
  }
);

// Indexes
configTemplateSchema.index({ equipmentCategory: 1, configType: 1 });
configTemplateSchema.index({ vendor: 1, model: 1 });
configTemplateSchema.index({ tags: 1 });
configTemplateSchema.index({ "compatibility.osVersions": 1 });
configTemplateSchema.index({ "compatibility.firmwareVersions": 1 });

// Virtuals
configTemplateSchema.virtual("displayName").get(function () {
  return `${this.vendor} ${this.model} - ${this.name} (v${this.version})`;
});

configTemplateSchema.virtual("configContent").get(function () {
  return this.configSourceType === "file"
    ? `File-based configuration: ${this.configFile.originalName}`
    : this.template;
});

// Hooks
configTemplateSchema.pre("save", function (next) {
  if (
    this.isModified("version") ||
    this.isModified("template") ||
    this.isModified("configFile")
  ) {
    if (!this.changeLog) this.changeLog = [];
    this.changeLog.push({
      version: this.version,
      changes: this.isModified("configFile")
        ? "Configuration file updated"
        : "Template content updated",
      changedBy:
        this._update?.$set?.lastUpdatedBy ||
        this.lastUpdatedBy ||
        this.createdBy,
    });
  }
  next();
});

// Static Methods
configTemplateSchema.statics.findByEquipmentCategoryAndType = function (
  category,
  configType
) {
  return this.find({
    equipmentCategory: category,
    configType: configType,
    isActive: true,
  }).sort({ version: -1 });
};

configTemplateSchema.statics.findCompatibleTemplates = function (device) {
  return this.find({
    equipmentCategory: device.category,
    isActive: true,
    $or: [
      { specificDeviceModels: { $size: 0 } },
      { specificDeviceModels: `${device.manufacturer} ${device.model}` },
    ],
  });
};

// Instance Methods
configTemplateSchema.methods.validateVariables = function (variables) {
  const errors = [];
  const varNames = new Set();

  this.variables.forEach((templateVar) => {
    if (varNames.has(templateVar.name)) {
      errors.push(`Duplicate variable name: ${templateVar.name}`);
      return;
    }
    varNames.add(templateVar.name);

    const providedVar = variables[templateVar.name];
    const varValue =
      providedVar !== undefined ? providedVar : templateVar.defaultValue;

    if (templateVar.required && varValue === undefined) {
      errors.push(`Variable ${templateVar.name} is required`);
      return;
    }

    if (varValue !== undefined) {
      if (templateVar.validationRegex) {
        const regex = new RegExp(templateVar.validationRegex);
        if (!regex.test(varValue)) {
          errors.push(
            `Variable ${templateVar.name} does not match required pattern`
          );
        }
      }

      switch (templateVar.dataType) {
        case "number":
          if (isNaN(Number(varValue))) {
            errors.push(`Variable ${templateVar.name} must be a number`);
          }
          break;
        case "ip":
          if (!isValidIP(varValue)) {
            errors.push(
              `Variable ${templateVar.name} must be a valid IP address`
            );
          }
          break;
        case "cidr":
          if (!isValidCIDR(varValue)) {
            errors.push(
              `Variable ${templateVar.name} must be a valid CIDR notation`
            );
          }
          break;
        case "boolean":
          if (!["true", "false", ""].includes(varValue.toLowerCase())) {
            errors.push(`Variable ${templateVar.name} must be true or false`);
          }
          break;
        case "select":
          if (varValue && !templateVar.options.includes(varValue)) {
            errors.push(
              `Variable ${
                templateVar.name
              } must be one of: ${templateVar.options.join(", ")}`
            );
          }
          break;
      }
    }
  });

  return errors.length ? errors : null;
};

configTemplateSchema.methods.isCompatibleWithDevice = function (device) {
  if (this.equipmentCategory !== device.category) {
    return false;
  }

  /*
  if (this.specificDeviceModels?.length > 0) {
    const deviceModel = `${device.manufacturer} ${device.model}`;
    return this.specificDeviceModels.some(
      (model) => model.toLowerCase() === deviceModel.toLowerCase()
    );
  }
    */

  return true;
};

/*
configurationTemplateSchema.methods.isCompatibleWithDevice = function (device) {
  // Basic category check
  if (this.equipmentCategory !== device.category) {
    return false;
  }

  // Optional: Check specific device models if specified

  if (this.specificDeviceModels?.length > 0) {
    const deviceModel = `${device.manufacturer} ${device.model}`;
    return this.specificDeviceModels.some(
      (model) => model.toLowerCase() === deviceModel.toLowerCase()
    );
  }


  return true;
};
*/

configTemplateSchema.methods.renderTemplate = function (variables = {}) {
  if (this.configSourceType !== "template") {
    throw new AppError(
      "Only template-based configurations can be rendered",
      400
    );
  }

  let rendered = this.template;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue =
      value !== undefined
        ? value
        : this.variables.find((v) => v.name === key)?.defaultValue || "";
    rendered = rendered.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      safeValue
    );
  }
  return rendered;
};

configTemplateSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    // If you have any other cleanup needed when a template is deleted
    next();
  }
);

// Helper Functions
function isValidIP(ip) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ip
  );
}

function isValidCIDR(cidr) {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/.test(
    cidr
  );
}

module.exports = mongoose.model("ConfigurationTemplate", configTemplateSchema);
