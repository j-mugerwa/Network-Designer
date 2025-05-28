// src/components/pages/CreateDesignPage.tsx
import { Box } from "@mui/material";
import { CreateDesignForm } from "@/components/features/designs/CreateDesignForm";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/router";

export const CreateDesignPage = () => {
  const router = useRouter();

  const handleSuccess = (designId: string) => {
    router.push(`/designs/${designId}`);
  };

  return (
    <AppLayout title="Create New Design">
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <CreateDesignForm onSuccess={handleSuccess} />
      </Box>
    </AppLayout>
  );
};
