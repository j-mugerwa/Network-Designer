import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { AppDispatch } from "@/store/store";
import { Alert } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import DeviceAssignment from "@/components/features/equipment/DesignAssign";
import {
  selectEquipmentError,
  clearEquipmentError,
} from "@/store/slices/equipmentSlice";

const AssignDevicesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const error = useSelector(selectEquipmentError);

  const handleClearError = () => {
    dispatch(clearEquipmentError());
  };

  return (
    <AppLayout title="Assign Devices">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Assign Devices to a Design"
          subtitle="Manage which devices are assigned to your network designs"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} className="mb-4">
            {error}
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <DeviceAssignment />
        </div>
      </div>
    </AppLayout>
  );
};

export default AssignDevicesPage;
