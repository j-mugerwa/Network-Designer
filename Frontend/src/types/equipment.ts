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
  //endOfLife?: string;
  endOfLife?: string | Date;
  createdBy: string;
  isSystemOwned: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationItem {
  category: string;
  //recommendedEquipment: Equipment;
  recommendedEquipment: string | Equipment;
  quantity: number;
  placement: string;
  justification: string;
  //alternatives: Equipment[];
  alternatives: string[] | Equipment[];
}

export interface EquipmentRecommendation {
  id: string;
  designId: string;
  recommendations: RecommendationItem[];
  createdAt: string;
}
