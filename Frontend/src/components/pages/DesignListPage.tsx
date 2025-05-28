// src/components/pages/DesignListPage.tsx
import { Box } from "@mui/material";
import { DesignList } from "@/components/features/designs/DesignList";
import { AppLayout } from "@/components/layout/AppLayout";

export const DesignListPage = () => {
  return (
    <AppLayout title="My Network Designs">
      <Box sx={{ p: 3 }}>
        <DesignList />
      </Box>
    </AppLayout>
  );
};
