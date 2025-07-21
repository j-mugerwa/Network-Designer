// src/types/configuration.ts
export interface Variable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  validationRegex?: string;
  example?: string;
  dataType: "string" | "number" | "ip" | "cidr" | "boolean" | "select";
  options?: string[];
  scope: "global" | "device" | "interface";
}

export interface ConfigDeployment {
  _id: string;
  name: string;
  version: string;
  configType: string;
  vendor: string;
  model: string;
  createdBy: UserReference;
  deploymentCount: number;
  deployments: Deployment[];
}

export type PaginationData = {
  //total: number;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export interface DeploymentReportsState {
  configDeployments: ConfigDeployment[];
  userDeployments: ConfigDeployment[];
  loading: boolean;
  error: string | null;
  pagination?: PaginationData;
}

/*
interface DeploymentReportsState {
  configDeployments: ConfigDeployment[];
  userDeployments: ConfigDeployment[];
  loading: boolean;
  error: string | null;
  pagination?: PaginationData;
}
  */

export interface Compatibility {
  osVersions?: string | string[];
  firmwareVersions?: string | string[];
}

export interface ConfigFile {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface UserReference {
  _id: string;
  name?: string;
  email?: string;
}

export interface Equipment {
  _id: string;
  model: string;
  ipAddress?: string;
  category: string;
  status: string;
}

export interface Deployment {
  model: string;
  vendor: string;
  configType: string;
  version: string;
  name: string;
  _id: string;
  device: Equipment | string;
  template: string | ConfigurationTemplate;
  deployedBy: UserReference | string;
  deployedAt: Date;
  variables?: Record<string, string>;
  renderedConfig?: string;
  fileDeployment?: {
    url: string;
    publicId: string;
    originalName: string;
    size: string;
  };
  notes?: string;
  status: DeploymentStatus;
}

export type DeploymentStatus = "pending" | "active" | "failed" | "rolled-back";

export interface ConfigurationTemplate {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  equipmentCategory: "switch" | "router" | "firewall" | "ap" | "server";
  specificDeviceModels?: string[];
  compatibility?: Compatibility;
  configSourceType: "template" | "file";
  configFile?: ConfigFile;
  template?: string;
  variables: Variable[];
  vendor: string;
  model: string;
  configType: string;
  version: string;
  isMajorVersion?: boolean;
  tags?: string[];
  createdBy: string | UserReference;
  lastUpdatedBy?: string;
  createdAt: Date;
  isActive: boolean;
  isSystemTemplate: boolean;
  validationScript?: string;
  approvalRequired: boolean;
  changeLog: Array<{
    version: string;
    changes: string;
    changedBy: string;
    changedAt: Date;
  }>;
  deployments: Deployment[];
}

export function isPopulatedEquipment(device: any): device is Equipment {
  return typeof device === "object" && "model" in device;
}

export function isPopulatedUser(user: any): user is UserReference {
  return typeof user === "object" && "name" in user;
}
