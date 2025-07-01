// src/pages/devices/create.tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  createNewEquipment,
  selectEquipmentCreating,
  selectEquipmentError,
  clearEquipmentError,
} from "@/store/slices/equipmentSlice";
import type { AppDispatch } from "@/store/store";
import EquipmentForm from "@/components/features/equipment/EquipmentForm";
//import { EquipmentFormData } from "@/components/features/equipment/EquipmentForm";
import { Alert, CircularProgress } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const CreateEquipmentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const creating = useSelector(selectEquipmentCreating);
  const error = useSelector(selectEquipmentError);

  const handleSubmit = async (
    data: any,
    files?: { imageFile?: File; datasheetFile?: File }
  ) => {
    const formData = new FormData();

    // Append basic fields
    formData.append("category", data.category);
    formData.append("manufacturer", data.manufacturer);
    formData.append("model", data.model);
    formData.append("specs", JSON.stringify(data.specs));
    formData.append("priceRange", data.priceRange);
    formData.append("typicalUseCase", data.typicalUseCase);
    formData.append("isPopular", data.isPopular.toString());
    formData.append("isActive", data.isActive.toString());

    // Append optional fields if they exist
    if (data.datasheetUrl) formData.append("datasheetUrl", data.datasheetUrl);
    if (data.releaseYear)
      formData.append("releaseYear", data.releaseYear.toString());
    if (data.endOfLife)
      formData.append("endOfLife", data.endOfLife.toISOString());
    if (data.warranty)
      formData.append("warranty", JSON.stringify(data.warranty));
    if (data.isSystemOwned)
      formData.append("isSystemOwned", data.isSystemOwned.toString());
    if (data.isPublic) formData.append("isPublic", data.isPublic.toString());
    if (data.location)
      formData.append("location", JSON.stringify(data.location));
    if (data.networkConfig)
      formData.append("networkConfig", JSON.stringify(data.networkConfig));
    if (data.maintenance)
      formData.append("maintenance", JSON.stringify(data.maintenance));

    // Append files if they exist
    if (files?.imageFile) formData.append("image", files.imageFile);
    if (files?.datasheetFile) formData.append("datasheet", files.datasheetFile);

    const result = await dispatch(createNewEquipment(formData));
    if (createNewEquipment.fulfilled.match(result)) {
      router.push("/devices");
    }
  };

  const handleClearError = () => {
    dispatch(clearEquipmentError());
  };

  return (
    <AppLayout title="Create Device">
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="container mx-auto px-4 py-8">
          <PageHeader
            title="Create Custom Equipment"
            subtitle="Add a new network device to your inventory"
          />

          {error && (
            <Alert severity="error" onClose={handleClearError} className="mb-4">
              {error}
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            {creating ? (
              <CircularProgress />
            ) : (
              <EquipmentForm onSubmit={handleSubmit} />
            )}
          </div>
        </div>
      </LocalizationProvider>
    </AppLayout>
  );
};

export default CreateEquipmentPage;
