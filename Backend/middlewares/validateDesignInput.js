// validation/designValidation.js
const Joi = require("joi");

const validateDesignInput = (data, isUpdate = false) => {
  // Common schema elements
  const baseSchema = {
    designName: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Design name is required",
      "string.min": "Design name must be at least 3 characters",
      "string.max": "Design name cannot exceed 100 characters",
    }),
    description: Joi.string().trim().max(500).allow("", null),
    isExistingNetwork: Joi.boolean().default(false),
    existingNetworkDetails: Joi.when("isExistingNetwork", {
      is: true,
      then: Joi.object({
        currentTopology: Joi.string()
          .valid("star", "bus", "ring", "mesh", "hybrid", "other")
          .required(),
        currentIssues: Joi.array()
          .items(
            Joi.string().valid(
              "bandwidth",
              "latency",
              "security",
              "reliability",
              "scalability",
              "management"
            )
          )
          .default([]),
        currentIPScheme: Joi.string()
          .pattern(
            /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/\d{1,2}$/
          )
          .message("Invalid IP scheme format"),
        currentDevices: Joi.array()
          .items(
            Joi.object({
              type: Joi.string()
                .valid("router", "switch", "firewall", "server", "access-point")
                .required(),
              model: Joi.string().required(),
              quantity: Joi.number().integer().min(1).default(1),
            })
          )
          .default([]),
      }),
      otherwise: Joi.object().default(null),
    }),
    requirements: Joi.object({
      totalUsers: Joi.string()
        .valid("1-50", "51-200", "201-500", "500+")
        .required(),
      wiredUsers: Joi.number().integer().min(0).default(0),
      wirelessUsers: Joi.number().integer().min(0).default(0),
      networkSegmentation: Joi.boolean().default(false),
      segments: Joi.when("networkSegmentation", {
        is: true,
        then: Joi.array()
          .items(
            Joi.object({
              name: Joi.string().trim().min(2).max(50).required(),
              type: Joi.string()
                .valid("department", "function", "security", "guest", "iot")
                .required(),
              users: Joi.number().integer().min(1).required(),
              bandwidthPriority: Joi.string()
                .valid("low", "medium", "high", "critical")
                .default("medium"),
              isolationLevel: Joi.string()
                .valid("none", "vlans", "physical", "full")
                .default("none"),
            })
          )
          .min(1),
        otherwise: Joi.array().length(0),
      }),
      bandwidth: Joi.object({
        upload: Joi.number().min(1).required(),
        download: Joi.number().min(1).required(),
        symmetric: Joi.boolean().default(false),
      }).required(),
      services: Joi.object({
        cloud: Joi.array()
          .items(
            Joi.string().valid("saas", "iaas", "paas", "storage", "backup")
          )
          .default([]),
        onPremise: Joi.array()
          .items(
            Joi.string().valid("erp", "crm", "fileserver", "email", "database")
          )
          .default([]),
        network: Joi.array()
          .items(
            Joi.string().valid("dhcp", "dns", "vpn", "proxy", "load-balancing")
          )
          .default([]),
      }).default(),
      ipScheme: Joi.object({
        private: Joi.string()
          .valid("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
          .default("192.168.0.0/16"),
        publicIPs: Joi.number().integer().min(0).default(0),
        ipv6: Joi.boolean().default(false),
      }).default(),
      securityRequirements: Joi.object({
        firewall: Joi.string()
          .valid("none", "basic", "enterprise", "utm")
          .default("basic"),
        ids: Joi.boolean().default(false),
        ips: Joi.boolean().default(false),
        contentFiltering: Joi.boolean().default(false),
        remoteAccess: Joi.string()
          .valid("none", "vpn", "rdp", "citrix")
          .default("none"),
      }).default(),
      redundancy: Joi.object({
        internet: Joi.boolean().default(false),
        coreSwitching: Joi.boolean().default(false),
        power: Joi.boolean().default(false),
      }).default(),
      budgetRange: Joi.string()
        .valid("low", "medium", "high", "unlimited")
        .default("medium"),
    }).required(),
  };

  // Update schema has optional fields
  const updateSchema = Object.keys(baseSchema).reduce((acc, key) => {
    acc[key] = baseSchema[key].optional();
    return acc;
  }, {});

  const schema = Joi.object(isUpdate ? updateSchema : baseSchema);

  return schema.validate(data, {
    abortEarly: false, // Return all errors not just the first one
    allowUnknown: false, // Reject unknown fields
    stripUnknown: true, // Remove unknown fields
  });
};

module.exports = { validateDesignInput };
