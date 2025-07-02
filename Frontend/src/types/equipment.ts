// src/types/equipment.ts

export interface EquipmentSpecs {
  ports?: number;
  portSpeed?: string;
  throughput?: string;
  wirelessStandards?: string[];
  powerRequirements?: string;
  vlanSupport?: boolean;
  layer?: number;
  [key: string]: any;
}

export interface Equipment {
  id: string;
  category: string;
  manufacturer: string;
  model: string;
  specs: EquipmentSpecs;
  priceRange: string;
  typicalUseCase: string;
  imageUrl?: string;
  datasheetUrl?: string;
  isPopular?: boolean;
  releaseYear?: number;
  endOfLife?: string | Date;
  createdBy: string;
  isSystemOwned: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  quantity?: number;
}

export interface EquipmentAssignment {
  equipmentId: string;
  quantity: number;
}

export interface DesignEquipmentAssignment {
  designId: string;
  equipment: EquipmentAssignment[];
}

export interface DesignEquipmentResponse {
  success: boolean;
  message: string;
  data: {
    devices: Equipment[];
  };
}

export interface UserEquipmentResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Equipment[];
}

export interface RecommendationItem {
  category: string;
  recommendedEquipment: Equipment;
  quantity: number;
  placement: string;
  justification: string;
  alternatives: Equipment[];
  isSystemRecommended: boolean;
}

export interface EquipmentRecommendation {
  id: string;
  designId: string;
  userId: string;
  recommendations: RecommendationItem[];
  generatedAt: string;
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentState {
  equipment: Equipment[];
  userEquipment: Equipment[];
  systemEquipment: Equipment[];
  recommendations: EquipmentRecommendation[];
  loading: boolean;
  error: string | null;
  currentRecommendation: EquipmentRecommendation | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  uploadingImage: boolean;
  designEquipment: Equipment[];
  assigningToDesign: boolean;
  removingFromDesign: boolean;
}
