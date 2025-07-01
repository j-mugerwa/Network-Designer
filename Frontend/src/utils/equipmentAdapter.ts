// src/utils/equipmentAdapter.ts
import { Equipment } from "@/types/equipment";
import { EquipmentFormData } from "@/components/features/equipment/EquipmentForm";

export const adaptEquipmentToForm = (
  equipment: Equipment
): Partial<EquipmentFormData> => {
  return {
    ...equipment,
    endOfLife: equipment.endOfLife ? new Date(equipment.endOfLife) : null,
    // Convert other date strings if needed
    specs: {
      ...equipment.specs,
      // Ensure any nested date strings are converted
    },
  };
};

export const adaptFormToEquipment = (
  formData: EquipmentFormData
): Partial<Equipment> => {
  return {
    ...formData,
    endOfLife: formData.endOfLife?.toISOString(),
    // Convert other Date objects back to strings if needed
  };
};
