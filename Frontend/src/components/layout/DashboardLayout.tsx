// src/components/layouts/DashboardLayout.tsx
import { Box } from "@mui/material";
import DashboardSidebar from "./DashboardSidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box sx={{ display: "flex" }}>
      <DashboardSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: { xs: "46px", sm: "46px", md: "100px" },
          transition: "margin-left 0.3s ease",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
