// src/pages/devices/edit/[id].tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import EquipmentForm from "@/components/features/equipment/EquipmentForm";
import {
  fetchEquipmentById,
  updateEquipmentDetails,
} from "@/store/slices/equipmentSlice";
import { EquipmentFormData } from "@/components/features/equipment/EquipmentForm";
import { adaptEquipmentToForm } from "@/utils/equipmentAdapter";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const EditEquipmentPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch<AppDispatch>();

  // Select the equipment item from Redux store
  const equipment = useSelector(
    (state: RootState) =>
      state.equipment.equipment.find((item) => item.id === id) ||
      state.equipment.userEquipment.find((item) => item.id === id) ||
      state.equipment.systemEquipment.find((item) => item.id === id)
  );

  const loading = useSelector((state: RootState) => state.equipment.updating);
  const error = useSelector((state: RootState) => state.equipment.error);

  useEffect(() => {
    if (id && !equipment) {
      // Fetch equipment if not already in store
      dispatch(fetchEquipmentById(id as string));
    }
  }, [id, dispatch, equipment]);

  const handleSubmit = async (
    data: EquipmentFormData,
    files?: { imageFile?: File; datasheetFile?: File }
  ) => {
    if (!id) return;

    const formData = new FormData();

    // Append all form data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob);
        }
      }
    });

    // Append files if they exist
    if (files?.imageFile) {
      formData.append("image", files.imageFile);
    }
    if (files?.datasheetFile) {
      formData.append("datasheet", files.datasheetFile);
    }

    try {
      await dispatch(
        updateEquipmentDetails({
          id: id as string,
          formData,
        })
      ).unwrap();

      // Redirect to equipment list after successful update
      router.push("/devices");
    } catch (error) {
      console.error("Failed to update equipment:", error);
    }
  };

  if (!equipment) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout title="Edit Device">
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EquipmentForm
          onSubmit={handleSubmit}
          //initialData={equipment}
          initialData={adaptEquipmentToForm(equipment)}
          loading={loading}
          isAdmin={true} // or determine based on user role
        />
      </LocalizationProvider>
    </AppLayout>
  );
};

export default EditEquipmentPage;
