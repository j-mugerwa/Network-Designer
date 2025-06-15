// pages/designs/[id]/edit.tsx
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchDesignById,
  selectDesigns,
} from "@/store/slices/networkDesignSlice";
import { CreateDesignForm } from "@/components/features/designs/CreateDesignForm";
import { AppLayout } from "@/components/layout/AppLayout";
import { Box, CircularProgress } from "@mui/material";

export const EditDesignPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentDesign, loading } = useAppSelector(selectDesigns);
  const { id } = router.query;

  useEffect(() => {
    if (id && typeof id === "string") {
      dispatch(fetchDesignById(id));
    }
  }, [id, dispatch]);

  if (loading || !currentDesign) {
    return (
      <AppLayout title="Edit Design">
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit Design: ${currentDesign.designName}`}>
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <CreateDesignForm initialData={currentDesign} isEditMode={true} />
      </Box>
    </AppLayout>
  );
};

EditDesignPage.getLayout = (page: React.ReactNode) => {
  return <AppLayout title="Edit Design">{page}</AppLayout>;
};

export default EditDesignPage;
