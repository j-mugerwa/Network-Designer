// src/types/configuration.d.ts
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

export interface Deployment {
  _id: string;
  device: string;
  deployedBy: string;
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
  status: "pending" | "active" | "failed" | "rolled-back";
}

export type DeploymentStatus = "pending" | "active" | "failed" | "rolled-back";

export interface ConfigurationTemplate {
  //type: ReactNode;
  _id: string;
  name: string;
  description?: string;
  equipmentCategory: "switch" | "router" | "firewall" | "ap" | "server";
  specificDeviceModels?: string[];
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
  compatibility?: {
    osVersions?: string[];
    firmwareVersions?: string[];
  };
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
