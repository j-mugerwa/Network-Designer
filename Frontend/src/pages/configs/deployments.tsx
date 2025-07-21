// src/pages/configs/deployments.tsx
import { useSelector } from "react-redux";
import {
  selectConfigDeploymentsLoading,
  selectConfigDeploymentsError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import { useAppDispatch } from "@/store/store";
import ConfigDeploymentsReport from "@/components/features/configs/ConfigDeploymentsReport";
import UserDeploymentsReport from "@/components/features/configs/UserDeploymentsReport";
import { Alert, Box, CircularProgress, Tabs, Tab, Paper } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";

const DeploymentsPage = () => {
  const dispatch = useAppDispatch();
  const error = useSelector(selectConfigDeploymentsError);
  const [activeTab, setActiveTab] = useState(0);

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <AppLayout title="Configuration Deployments">
      <Box sx={{ p: 4 }}>
        <PageHeader
          title="Configuration Deployments"
          subtitle="View and manage configuration deployments"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Deployments" />
            <Tab label="My Deployments" />
          </Tabs>
        </Paper>

        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
            overflow: "hidden",
          }}
        >
          {activeTab === 0 && <ConfigDeploymentsReport />}
          {activeTab === 1 && <UserDeploymentsReport />}
        </Box>
      </Box>
    </AppLayout>
  );
};

export default DeploymentsPage;
