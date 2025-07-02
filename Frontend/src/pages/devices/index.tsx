// src/pages/devices/index.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserEquipment,
  selectUserEquipment,
  selectEquipmentLoading,
  selectEquipmentError,
  clearEquipmentError,
} from "@/store/slices/equipmentSlice";
import { RootState } from "@/store/store";
import type { AppDispatch } from "@/store/store";
import EquipmentTable from "@/components/features/equipment/EquipmentTable";
import { Alert, CircularProgress } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const EquipmentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userEquipment = useSelector(selectUserEquipment);
  const loading = useSelector(selectEquipmentLoading);
  const error = useSelector(selectEquipmentError);

  useEffect(() => {
    dispatch(fetchUserEquipment());
  }, [dispatch]);

  const handleClearError = () => {
    dispatch(clearEquipmentError());
  };

  return (
    <AppLayout title="My Devices">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="My Network Equipment"
          subtitle="View and manage your network devices"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} className="mb-4">
            {typeof error === "string" ? error : "Failed to load equipment"}
          </Alert>
        )}

        {loading ? (
          <CircularProgress />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <EquipmentTable equipment={userEquipment} />{" "}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EquipmentPage;
