// services/reportGenerator.js
const IPCalculator = require("./ipCalculator");
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

class ReportGenerator {
  constructor() {
    this.registerHelpers();
  }

  registerHelpers() {
    // Format IP addresses nicely
    Handlebars.registerHelper("formatIP", function (ip) {
      return ip ? ip.replace(/\/\d+$/, "") : "N/A";
    });

    // Format bandwidth
    Handlebars.registerHelper("formatBandwidth", function (bandwidth) {
      return `${bandwidth} Mbps`;
    });

    // Conditional sections
    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
      switch (operator) {
        case "==":
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!=":
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case "&&":
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case "||":
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });

    Handlebars.registerHelper("formatDate", function (date) {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper("toUpperCase", function (str) {
      return str?.toUpperCase() || "";
    });

    Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper("json", function (context) {
      return JSON.stringify(context);
    });
  }

  async generateFullReport(design) {
    const totalHosts = this.calculateTotalHosts(design.requirements);

    const reportData = {
      design: design.toObject(),
      network: {
        ipScheme: IPCalculator.calculateSubnets(
          totalHosts,
          design.isExistingNetwork
            ? design.existingNetworkDetails?.currentIPScheme
            : null,
          design.requirements.ipScheme.private
        ),
        vlanScheme: design.requirements.networkSegmentation
          ? IPCalculator.calculateVLANs(design.requirements.segments)
          : null,
        publicIPs: IPCalculator.calculatePublicIPAllocation(
          design.requirements.ipScheme.publicIPs,
          design.requirements.services.network
        ),
      },
      equipment: this.generateEquipmentRecommendations(design),
      implementation: this.generateImplementationPlan(design),
      summary: this.generateSummary(design),
      generatedAt: new Date().toISOString(),
    };

    return reportData;
  }

  // Make the report more professional
  async generateProfessionalReport(design) {
    const data = await this.generateFullReport(design);

    const sections = [
      this.createTitlePage(design),
      this.createExecutiveSummary(data),
      this.createNetworkDesign(data),
      this.createIPScheme(data),
      this.createEquipmentRecommendations(data),
      this.createImplementationPlan(data),
      this.createCostEstimate(data),
    ];

    return {
      title: `Network Design Report - ${design.designName}`,
      sections: sections.filter((section) => section !== null),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        client: design.userId.company || "Client Name",
      },
    };
  }

  async loadDefaultTemplates() {
    try {
      const templatesDir = path.join(__dirname, "../templates");
      const files = fs.readdirSync(templatesDir);

      this.defaultTemplates = files.reduce((acc, file) => {
        if (file.endsWith(".hbs")) {
          const name = path.basename(file, ".hbs");
          const content = fs.readFileSync(
            path.join(templatesDir, file),
            "utf8"
          );
          acc[name] = Handlebars.compile(content);
        }
        return acc;
      }, {});
    } catch (err) {
      console.error("Failed to load default templates:", err);
      this.defaultTemplates = {};
    }
  }

  createTitlePage(design) {
    return {
      title: "Network Design Report",
      content: `
      <div style="text-align:center; margin-bottom: 2cm;">
        <h1>${design.designName}</h1>
        <h3>Professional Network Design Report</h3>
        <hr/>
        <p>Prepared for: ${design.userId.company || "Client Name"}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Design Version: ${design.version}</p>
        <p>Status: ${design.designStatus}</p>
      </div>
    `,
      pageBreak: true,
    };
  }

  createExecutiveSummary(data) {
    return {
      title: "Executive Summary",
      content: `
      <h2>Project Overview</h2>
      <p>This report outlines the comprehensive network design for <strong>${
        data.design.designName
      }</strong>,
      supporting <strong>${
        data.summary.totalUsers
      }</strong> users with <strong>${data.summary.bandwidth}</strong>
      ${
        data.design.requirements.bandwidth.symmetric
          ? "symmetric"
          : "asymmetric"
      } bandwidth.</p>

      <h3>Key Features</h3>
      <ul>
        <li>${
          data.design.requirements.networkSegmentation ? "Segmented" : "Flat"
        } network architecture</li>
        <li>${this.capitalizeFirstLetter(
          data.design.requirements.securityRequirements.firewall
        )} firewall protection</li>
        <li>${
          data.design.requirements.redundancy.internet ? "Redundant" : "Single"
        } internet connection</li>
        <li>${
          data.design.requirements.cloudServices
            ? "Cloud-integrated"
            : "On-premises focused"
        } services</li>
      </ul>

      <h3>Project Scope</h3>
      <p>The design includes ${
        data.design.requirements.wiredUsers
      } wired connections and
      ${
        data.design.requirements.wirelessUsers
      } wireless connections, with an estimated
      implementation budget of $${data.summary.estimatedCost.range.low} - $${
        data.summary.estimatedCost.range.high
      }.</p>
    `,
      pageBreak: true,
    };
  }

  createNetworkDesign(data) {
    return {
      title: "Network Architecture",
      content: `
      <h2>Network Design Specifications</h2>
      <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
        <tr>
          <th style="width:30%;">Specification</th>
          <th style="width:70%;">Details</th>
        </tr>
        <tr>
          <td>Total Users</td>
          <td>${data.summary.totalUsers}</td>
        </tr>
        <tr>
          <td>Wired Users</td>
          <td>${data.design.requirements.wiredUsers}</td>
        </tr>
        <tr>
          <td>Wireless Users</td>
          <td>${data.design.requirements.wirelessUsers}</td>
        </tr>
        <tr>
          <td>Bandwidth</td>
          <td>${data.summary.bandwidth} (${
        data.design.requirements.bandwidth.symmetric
          ? "Symmetric"
          : "Asymmetric"
      })</td>
        </tr>
        <tr>
          <td>Network Segmentation</td>
          <td>${
            data.design.requirements.networkSegmentation
              ? "Enabled"
              : "Disabled"
          }</td>
        </tr>
        <tr>
          <td>Primary IP Scheme</td>
          <td>${data.design.requirements.ipScheme.private}</td>
        </tr>
      </table>

      <h3>Security Features</h3>
      <ul>
        <li>Firewall: ${this.capitalizeFirstLetter(
          data.design.requirements.securityRequirements.firewall
        )}</li>
        <li>Intrusion Detection: ${
          data.design.requirements.securityRequirements.ids
            ? "Enabled"
            : "Disabled"
        }</li>
        <li>Content Filtering: ${
          data.design.requirements.securityRequirements.contentFiltering
            ? "Enabled"
            : "Disabled"
        }</li>
        <li>Remote Access: ${this.capitalizeFirstLetter(
          data.design.requirements.securityRequirements.remoteAccess
        )}</li>
      </ul>
    `,
    };
  }

  createIPScheme(data) {
    return {
      title: "IP Addressing Plan",
      content: `
      <h2>IP Subnet Allocation</h2>
      ${data.network.ipScheme
        .map(
          (subnet, index) => `
        <h3>Subnet ${index + 1}: ${subnet.network}</h3>
        <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse; margin-bottom: 15px;">
          <tr>
            <td style="width:30%;">Usable Range</td>
            <td style="width:70%;">${subnet.range}</td>
          </tr>
          <tr>
            <td>Gateway</td>
            <td>${subnet.gateway}</td>
          </tr>
          <tr>
            <td>Broadcast</td>
            <td>${subnet.broadcast}</td>
          </tr>
          <tr>
            <td>Subnet Mask</td>
            <td>${subnet.subnetMask}</td>
          </tr>
        </table>
      `
        )
        .join("")}

      ${
        data.network.vlanScheme
          ? `
      <h2>VLAN Configuration</h2>
      <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;">
        <tr>
          <th>Segment Name</th>
          <th>VLAN ID</th>
          <th>Type</th>
          <th>Recommended Configuration</th>
        </tr>
        ${data.network.vlanScheme
          .map(
            (vlan) => `
          <tr>
            <td>${vlan.name}</td>
            <td>${vlan.vlanId}</td>
            <td>${this.capitalizeFirstLetter(vlan.type)}</td>
            <td>
              ${vlan.recommendedConfig.trunk ? "Trunk port" : "Access port"}
              ${
                vlan.recommendedConfig.nativeVlan
                  ? `(Native VLAN ${vlan.recommendedConfig.nativeVlan})`
                  : ""
              }
            </td>
          </tr>
        `
          )
          .join("")}
      </table>
      `
          : ""
      }
    `,
      pageBreak: true,
    };
  }

  createEquipmentRecommendations(data) {
    return {
      title: "Equipment Recommendations",
      content: `
      <h2>Recommended Network Equipment</h2>
      ${Object.entries(data.equipment)
        .map(
          ([category, items]) => `
        ${
          items.length > 0
            ? `
          <h3>${this.capitalizeFirstLetter(category)}</h3>
          <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse; margin-bottom: 15px;">
            <tr>
              <th>Model</th>
              <th>Quantity</th>
              <th>Purpose</th>
            </tr>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.model}</td>
                <td>${item.quantity}</td>
                <td>${item.purpose}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        `
            : ""
        }
      `
        )
        .join("")}

      <h3>Justification</h3>
      <p>The recommended equipment was selected based on:</p>
      <ul>
        <li>User count requirements (${data.summary.totalUsers})</li>
        <li>Bandwidth needs (${data.summary.bandwidth})</li>
        <li>Security requirements (${this.capitalizeFirstLetter(
          data.design.requirements.securityRequirements.firewall
        )} firewall)</li>
        <li>Future scalability considerations</li>
      </ul>
    `,
    };
  }

  createImplementationPlan(data) {
    return {
      title: "Implementation Plan",
      content: `
      <h2>Project Phases</h2>
      ${data.implementation
        .map(
          (phase, index) => `
        <h3>Phase ${index + 1}: ${phase.name}</h3>
        <p><strong>Duration:</strong> ${phase.duration}</p>
        <p><strong>Key Tasks:</strong></p>
        <ol>
          ${phase.tasks.map((task) => `<li>${task}</li>`).join("")}
        </ol>
        ${
          phase.dependencies.length > 0
            ? `
          <p><strong>Dependencies:</strong> ${phase.dependencies.join(", ")}</p>
        `
            : ""
        }
      `
        )
        .join("")}

      <h3>Recommended Timeline</h3>
      <p>The complete implementation is estimated to take approximately
      ${this.calculateTotalDuration(
        data.implementation
      )} from project kickoff.</p>
    `,
      pageBreak: true,
    };
  }

  createCostEstimate(data) {
    return {
      title: "Budget Estimate",
      content: `
      <h2>Cost Projection</h2>
      <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse; margin-bottom: 20px;">
        <tr>
          <th style="width:30%;">Item</th>
          <th style="width:70%;">Estimate</th>
        </tr>
        <tr>
          <td>Budget Range</td>
          <td>$${data.summary.estimatedCost.range.low} - $${
        data.summary.estimatedCost.range.high
      } ${data.summary.estimatedCost.currency}</td>
        </tr>
        <tr>
          <td>Implementation Complexity</td>
          <td>${this.getComplexityLevel(
            data.design.requirements.totalUsers
          )}</td>
        </tr>
        <tr>
          <td>Included Services</td>
          <td>${data.summary.estimatedCost.notes}</td>
        </tr>
      </table>

      <h3>Cost Considerations</h3>
      <ul>
        <li>${
          data.design.requirements.budgetRange === "high"
            ? "Premium"
            : "Standard"
        } budget allocation</li>
        <li>${
          data.design.requirements.securityRequirements.firewall ===
          "enterprise"
            ? "Enterprise-grade"
            : "Basic"
        } security features</li>
        <li>${
          data.design.requirements.redundancy.internet
            ? "Redundant"
            : "Standard"
        } infrastructure</li>
      </ul>
    `,
    };
  }

  // Helper methods
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  calculateTotalDuration(phases) {
    const weeks = phases.reduce((total, phase) => {
      const match = phase.duration.match(/(\d+)\s*weeks?/i);
      return total + (match ? parseInt(match[1]) : 0);
    }, 0);
    return weeks > 4 ? `${Math.round(weeks / 4)} months` : `${weeks} weeks`;
  }

  getComplexityLevel(totalUsers) {
    switch (totalUsers) {
      case "1-50":
        return "Low";
      case "51-200":
        return "Medium";
      case "201-500":
        return "High";
      default:
        return "Very High";
    }
  }

  createTitlePage(design) {
    return {
      title: "Network Design Report",
      content: `
      <div style="text-align:center; margin-bottom: 2cm;">
        <h1>${design.designName}</h1>
        <h3>Professional Network Design Report</h3>
        <hr/>
        <p>Prepared for: ${design.userId.company || "Client Name"}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Design Version: ${design.version}</p>
      </div>
    `,
      pageBreak: true,
    };
  }

  createExecutiveSummary(data) {
    return {
      title: "Executive Summary",
      content: `
      <h2>Project Overview</h2>
      <p>This report outlines the network design for ${data.design.designName},
      supporting ${data.summary.totalUsers} users with ${data.summary.bandwidth}
      symmetrical bandwidth.</p>

      <h3>Key Features</h3>
      <ul>
        <li>${
          data.design.requirements.networkSegmentation
            ? "Segmented network architecture"
            : "Flat network architecture"
        }</li>
        <li>${
          data.design.requirements.securityRequirements.firewall
        } firewall protection</li>
        <li>${
          data.design.requirements.redundancy.internet
            ? "Redundant internet connections"
            : "Single internet connection"
        }</li>
      </ul>
    `,
    };
  }

  createNetworkDesign(data) {
    return {
      title: "Network Architecture",
      content: `
      <h2>Network Design Specifications</h2>
      <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;">
        <tr>
          <th>Total Users</th>
          <td>${data.summary.totalUsers}</td>
        </tr>
        <tr>
          <th>Wired Users</th>
          <td>${data.design.requirements.wiredUsers}</td>
        </tr>
        <tr>
          <th>Wireless Users</th>
          <td>${data.design.requirements.wirelessUsers}</td>
        </tr>
        <tr>
          <th>Bandwidth</th>
          <td>${data.summary.bandwidth}</td>
        </tr>
      </table>
    `,
    };
  }

  // ... similar methods for other sections ...

  async generateFromTemplate(design, template, user = null) {
    // Generate the base report data
    const reportData = await this.generateFullReport(design);

    // Initialize compiled sections array
    const compiledSections = [];

    // Sort sections by order
    const sortedSections = template.sections.sort((a, b) => a.order - b.order);

    // Process each section
    for (const section of sortedSections) {
      try {
        // Check conditional logic if present
        if (section.conditionalLogic) {
          const shouldInclude = this.evaluateCondition(
            section.conditionalLogic.expression,
            reportData
          );
          if (!shouldInclude) continue;
        }

        // Prepare section context with additional helpers
        const sectionContext = {
          ...reportData,
          $section: section,
          $helpers: {
            formatCurrency: (value) => `$${value.toLocaleString()}`,
            formatDate: (date) => new Date(date).toLocaleDateString(),
            toUpperCase: (str) => str?.toUpperCase() || "",
          },
        };

        // Use default template if available, otherwise compile the provided template
        const templateFn =
          this.defaultTemplates?.[section.key] ||
          Handlebars.compile(section.contentTemplate);

        // Compile the section content
        const compiledContent = templateFn(sectionContext);

        // Add to compiled sections
        compiledSections.push({
          title: section.title,
          key: section.key,
          content: compiledContent,
          pageBreak: section.pageBreak || false,
          styles: section.styles || {
            titleFontSize: 16,
            contentFontSize: 12,
            margin: 50,
          },
        });
      } catch (error) {
        console.error(`Error processing section ${section.key}:`, error);
        // Fallback to simple error display in the report
        compiledSections.push({
          title: section.title,
          key: section.key,
          content: `<div class="error">Error rendering this section: ${error.message}</div>`,
          pageBreak: false,
          styles: {
            titleFontSize: 16,
            contentFontSize: 12,
            margin: 50,
          },
        });
      }
    }

    // Prepare metadata
    const metadata = {
      template: template.name,
      templateVersion: template.version,
      designVersion: design.version,
      generatedAt: new Date().toISOString(),
      author: user?.name || "System",
      client: design.userId?.company || "Client",
      ...(template.metadata || {}),
    };

    // Return the complete report structure
    return {
      title: `${design.designName} - ${template.name}`,
      sections: compiledSections,
      metadata,
      styles: {
        coverPage: template.styles?.coverPage || {
          titleFontSize: 24,
          subtitleFontSize: 18,
          logoPosition: "center",
        },
        header: template.styles?.header || {
          fontSize: 10,
          content: `Report: ${template.name} | ${metadata.client}`,
        },
        footer: template.styles?.footer || {
          fontSize: 10,
          content: `Page {{page}} of {{pages}} | Generated on ${new Date(
            metadata.generatedAt
          ).toLocaleDateString()}`,
        },
        table: template.styles?.table || {
          headerBackground: "#f5f5f5",
          borderColor: "#dddddd",
          cellPadding: 5,
        },
      },
      rawData: reportData, // Include raw data for debugging or further processing
    };
  }

  evaluateCondition(expression, data) {
    // Simple condition evaluation - in production use a proper expression evaluator
    try {
      return new Function("data", `return ${expression}`)(data);
    } catch (e) {
      console.error("Condition evaluation error:", e);
      return false;
    }
  }

  calculateTotalHosts(requirements) {
    let total = requirements.wiredUsers + requirements.wirelessUsers;
    return Math.ceil(total * 1.2); // 20% growth buffer
  }

  generateEquipmentRecommendations(design) {
    // Enhanced equipment recommendation logic
    const { totalUsers, bandwidth, securityRequirements } = design.requirements;

    const recommendations = {
      routers: [],
      switches: [],
      accessPoints: [],
      securityDevices: [],
    };

    // Router recommendations
    if (totalUsers === "1-50") {
      recommendations.routers.push({
        model: "Cisco ISR 1100",
        quantity: 1,
        purpose: "Core routing for small office",
      });
    } else if (totalUsers === "51-200") {
      recommendations.routers.push({
        model: "Cisco ISR 4300",
        quantity: 1,
        purpose: "Core routing for medium office",
      });
    }

    // Switch recommendations based on user count and segmentation
    const switchCount = design.requirements.networkSegmentation
      ? Math.ceil(design.requirements.wiredUsers / 24) + 1
      : Math.ceil(design.requirements.wiredUsers / 48);

    recommendations.switches.push({
      model: "Cisco Catalyst 9200",
      quantity: switchCount,
      purpose: "Access layer switching",
    });

    // Add more recommendation logic as needed...

    return recommendations;
  }

  generateImplementationPlan(design) {
    const phases = [];

    // Phase 1 - Core Infrastructure
    phases.push({
      name: "Core Infrastructure",
      tasks: [
        "Install and configure core routers",
        "Set up primary switching infrastructure",
        "Implement basic network segmentation",
      ],
      duration: "2 weeks",
      dependencies: [],
    });

    // Add more phases as needed...

    return phases;
  }

  generateSummary(design) {
    return {
      totalUsers: design.requirements.totalUsers,
      bandwidth: `${design.requirements.bandwidth.upload}/${design.requirements.bandwidth.download} Mbps`,
      securityLevel: design.requirements.securityRequirements.firewall,
      estimatedCost: this.estimateCost(design),
    };
  }

  estimateCost(design) {
    // Enhanced cost estimation logic
    let baseCost = 0;

    if (design.requirements.totalUsers === "1-50") baseCost = 5000;
    else if (design.requirements.totalUsers === "51-200") baseCost = 15000;
    // Add more pricing tiers...

    // Adjust for security requirements
    if (design.requirements.securityRequirements.firewall === "enterprise")
      baseCost *= 1.5;
    if (design.requirements.securityRequirements.ips) baseCost += 3000;

    return {
      range: {
        low: Math.round(baseCost * 0.8),
        high: Math.round(baseCost * 1.2),
      },
      currency: "USD",
      notes: "Estimate includes hardware and basic configuration",
    };
  }
}

module.exports = new ReportGenerator();
