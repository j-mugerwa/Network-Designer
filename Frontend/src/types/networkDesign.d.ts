// src/types/networkDesign.d.ts
import { Types } from "mongoose";

export type DesignStatus = "draft" | "active" | "archived" | "template";
export type NetworkTopology =
  | "star"
  | "bus"
  | "ring"
  | "mesh"
  | "hybrid"
  | "other";
export interface NetworkSegment {
  name: string;
  type: "department" | "function" | "security" | "guest" | "iot";
  users: number;
  bandwidthPriority: "low" | "medium" | "high" | "critical";
  isolationLevel: "none" | "vlans" | "physical" | "full";
}

export interface BandwidthRequirements {
  upload: number; // in Mbps
  download: number; // in Mbps
  symmetric: boolean;
}

export interface NetworkServices {
  cloud?: Array<"saas" | "iaas" | "paas" | "storage" | "backup">;
  onPremise?: Array<"erp" | "crm" | "fileserver" | "email" | "database">;
  network?: Array<"dhcp" | "dns" | "vpn" | "proxy" | "load-balancing">;
}

export interface IPScheme {
  private: "10.0.0.0/8" | "172.16.0.0/12" | "192.168.0.0/16";
  publicIPs: number;
  ipv6: boolean;
}

export interface SecurityRequirements {
  firewall: "none" | "basic" | "enterprise" | "utm";
  ids: boolean;
  ips: boolean;
  contentFiltering: boolean;
  remoteAccess: "none" | "vpn" | "rdp" | "citrix";
}

export interface RedundancyRequirements {
  internet: boolean;
  coreSwitching: boolean;
  power: boolean;
}

export interface NetworkDevice {
  type: "router" | "switch" | "firewall" | "server" | "access-point";
  model: string;
  quantity: number;
}

export interface ExistingNetworkDetails {
  currentTopology?: "star" | "bus" | "ring" | "mesh" | "hybrid" | "other" | "";
  currentIssues?: Array<
    | "bandwidth"
    | "latency"
    | "security"
    | "reliability"
    | "scalability"
    | "management"
  >;
  currentIPScheme?: string;
  currentDevices?: NetworkDevice[];
}

export interface DesignRequirements {
  totalUsers: "1-50" | "51-200" | "201-500" | "500+";
  wiredUsers: number;
  wirelessUsers: number;
  networkSegmentation: boolean;
  segments?: NetworkSegment[];
  bandwidth: BandwidthRequirements;
  services: NetworkServices;
  ipScheme: IPScheme;
  securityRequirements: SecurityRequirements;
  redundancy: RedundancyRequirements;
  budgetRange: "low" | "medium" | "high" | "unlimited";
}

export interface NetworkDesign {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  designName: string;
  description?: string;
  isExistingNetwork: boolean;
  existingNetworkDetails?: ExistingNetworkDetails;
  requirements: DesignRequirements;
  designStatus: DesignStatus;
  deviceCount: number;
  version: number;
  isTemplate: boolean;
  devices: Types.ObjectId[];
  reports: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  lastModified?: Date;
}

// Frontend-friendly version (without Mongoose types)
export interface NetworkDesignUI {
  //data: any;
  id: string;
  userId: string;
  designName: string;
  description?: string;
  isExistingNetwork: boolean;
  existingNetworkDetails?: ExistingNetworkDetails;
  requirements: DesignRequirements;
  designStatus: DesignStatus;
  version: number;
  isTemplate: boolean;
  deviceCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
}

// NetworkDesignUI extends the Payload.
export interface NetworkDesignUI extends CreateDesignPayload {
  id: string;
  userId: string;
  designStatus: DesignStatus;
  version: number;
  isTemplate: boolean;
  deviceCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
}

// For design creation payload
export interface CreateDesignPayload {
  designName: string;
  description?: string;
  teamId?: string; //Added teamId
  isExistingNetwork?: boolean;
  existingNetworkDetails?: ExistingNetworkDetails;
  requirements?: Partial<DesignRequirements>;
}

// For design update payload
export interface UpdateDesignPayload extends Partial<CreateDesignPayload> {
  designStatus?: DesignStatus;
}

//API response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: {
    resource: string;
    operation: string;
    timestamp: string;
  };
}

//Design Creation Response.
export interface DesignCreationResponse {
  design: NetworkDesign | NetworkDesignUI;
  //design: NetworkDesign;
  message?: string;
  limits: {
    current: number;
    limit: number;
    remaining: number;
  };
  actions: Array<{
    action: string;
    method: string;
    url: string;
  }>;
}
