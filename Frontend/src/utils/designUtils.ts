import { NetworkDesign, NetworkDesignUI } from "@/types/networkDesign";

export const convertToNetworkDesignUI = (
  design: NetworkDesign
): NetworkDesignUI => {
  if (!design._id || !design.userId) {
    throw new Error("Invalid NetworkDesign: Missing required fields");
  }

  return {
    id: design._id.toString(),
    userId: design.userId.toString(),
    designName: design.designName,
    description: design.description,
    isExistingNetwork: design.isExistingNetwork,
    existingNetworkDetails: design.existingNetworkDetails,
    requirements: design.requirements,
    designStatus: design.designStatus,
    version: design.version,
    isTemplate: design.isTemplate,
    deviceCount: design.deviceCount || 0, // Use deviceCount from backend
    reportCount: design.reports?.length || 0, // Fallback if reports missing
    createdAt: design.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: design.updatedAt?.toISOString() || new Date().toISOString(),
    lastModified: design.lastModified?.toISOString(),
  };
};
