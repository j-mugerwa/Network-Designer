// services/ipCalculator.js
const ip = require("ip");
//const { networkInterfaces } = require("os");
//const IPCIDR = require("ip-cidr");

class IPCalculator {
  static calculateSubnets(totalHosts, existingScheme, preferredPrivateIP) {
    const networks = [];
    let baseNetwork = preferredPrivateIP || "192.168.0.0/16";

    // Extract base IP and prefix from CIDR notation
    const [baseIP, prefix] = baseNetwork.split("/");
    const subnetSize = this.getSubnetSize(totalHosts);

    // Calculate subnet mask from the prefix length
    const subnetMask = this.cidrToMask(prefix || "24");

    // Calculate first 5 subnets (for demonstration)
    for (let i = 0; i < 5; i++) {
      const networkLong =
        ip.toLong(baseIP) + i * (Math.pow(2, 32 - subnetSize) - 2);
      const networkAddress = ip.fromLong(networkLong);
      const firstHost = ip.fromLong(networkLong + 1);
      const lastHost = ip.fromLong(networkLong + totalHosts);
      const broadcast = ip.fromLong(networkLong + totalHosts + 1);

      networks.push({
        network: `${networkAddress}/${subnetSize}`,
        range: `${firstHost} - ${lastHost}`,
        gateway: firstHost,
        broadcast: broadcast,
        subnetMask: subnetMask,
      });
    }

    return networks;
  }

  /*
  static calculateSubnets(totalHosts, existingScheme, preferredPrivateIP) {
    const cidr = new IPCIDR(preferredPrivateIP || "192.168.0.0/16");
    if (!cidr.isValid()) throw new Error("Invalid CIDR notation");

    const subnetSize = this.getSubnetSize(totalHosts);
    const subnets = cidr.toRangeList(subnetSize, { from: 1, limit: 5 });

    return subnets.map((net) => ({
      network: net,
      range: `${cidr.start(net)} - ${cidr.end(net)}`,
      gateway: cidr.start(net),
      broadcast: cidr.end(net),
      subnetMask: cidr.mask(net),
    }));
  }
    */

  static cidrToMask(prefix) {
    const maskLong = ~(0xffffffff >>> prefix);
    return ip.fromLong(maskLong);
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
      if (services.includes("vpn")) {
        allocations.push({
          purpose: "VPN Endpoint",
          ip: `203.0.113.${ipIndex++}`,
          services: ["ipsec", "openvpn"],
        });
      }

      // Web services if needed
      if (services.includes("web")) {
        allocations.push({
          purpose: "Web Server",
          ip: `203.0.113.${ipIndex++}`,
          services: ["http", "https"],
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
