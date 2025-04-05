// services/ipCalculator.js
const ip = require("ip");

class IPCalculator {
  static calculateSubnets(totalHosts, existingScheme, preferredPrivateIP) {
    const networks = [];
    let baseNetwork = preferredPrivateIP || "192.168.0.0/16";

    // Simple implementation - in production you'd want more sophisticated allocation
    const subnetSize = this.getSubnetSize(totalHosts);
    const subnetMask = ip.mask(baseNetwork).toString();

    // Calculate first 5 subnets (for demonstration)
    for (let i = 0; i < 5; i++) {
      const networkAddress = ip.cidrSubnet(baseNetwork).networkAddress;
      const firstHost = ip.fromLong(ip.toLong(networkAddress) + 1);
      const lastHost = ip.fromLong(ip.toLong(networkAddress) + totalHosts);
      const broadcast = ip.fromLong(ip.toLong(networkAddress) + totalHosts + 1);

      networks.push({
        network: `${networkAddress}/${subnetSize}`,
        range: `${firstHost} - ${lastHost}`,
        gateway: firstHost,
        broadcast: broadcast,
        subnetMask: subnetMask,
      });

      // Move to next network (simplified - real implementation would track allocations)
      baseNetwork =
        ip.fromLong(ip.toLong(networkAddress) + totalHosts + 2) +
        `/${subnetSize}`;
    }

    return networks;
  }

  static getSubnetSize(totalHosts) {
    if (totalHosts <= 30) return 27; // /27 = 30 hosts
    if (totalHosts <= 62) return 26; // /26 = 62 hosts
    if (totalHosts <= 126) return 25; // /25 = 126 hosts
    if (totalHosts <= 254) return 24; // /24 = 254 hosts
    return 16; // Default to /16 for large networks
  }

  static calculateVLANs(segments) {
    const vlanBase = 100;
    return segments.map((segment, index) => ({
      name: segment.name,
      vlanId: vlanBase + index,
      type: segment.type,
      recommendedConfig: {
        trunk: true,
        nativeVlan: segment.type === "primary" ? vlanBase + index : false,
        allowedVlans: [vlanBase + index],
      },
    }));
  }

  static calculatePublicIPAllocation(publicIPs, services) {
    const allocations = [];
    let ipIndex = 1;

    if (publicIPs > 0) {
      // First IP for firewall/NAT
      allocations.push({
        purpose: "Firewall/NAT",
        ip: `203.0.113.${ipIndex++}`,
        services: ["security"],
      });

      // Public-facing services
      if (services.includes("web")) {
        allocations.push({
          purpose: "Web Server",
          ip: `203.0.113.${ipIndex++}`,
          services: ["http", "https"],
        });
      }

      // VPN endpoint if needed
      if (services.includes("vpn")) {
        allocations.push({
          purpose: "VPN Endpoint",
          ip: `203.0.113.${ipIndex++}`,
          services: ["ipsec", "openvpn"],
        });
      }
    }

    return {
      availableIPs: publicIPs,
      usedIPs: allocations.length,
      allocations: allocations,
    };
  }
}

module.exports = IPCalculator;
