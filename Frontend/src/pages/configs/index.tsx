// src/pages/configs/index.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserTemplates,
  selectTemplateLoading,
  selectTemplateError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import { useAppDispatch, type AppDispatch } from "@/store/store";
import ConfigurationsList from "@/components/features/configs/ConfigurationList";
import { Alert, Box, Skeleton } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { isCancel } from "axios";

const ConfigurationsPage = () => {
  const dispatch = useAppDispatch();
  const loading = useSelector(selectTemplateLoading);
  const error = useSelector(selectTemplateError);

  useEffect(() => {
    const controller = new AbortController();
    dispatch(fetchUserTemplates({ signal: controller.signal }));

    return () => {
      controller.abort();
    };
  }, [dispatch]);

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  return (
    <AppLayout title="Configuration Templates">
      <Box sx={{ p: 4 }}>
        <PageHeader
          title="Configuration Templates"
          subtitle="Manage your network configuration templates"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={72} sx={{ mb: 2 }} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 1,
              overflow: "hidden",
            }}
          >
            <ConfigurationsList />
          </Box>
        )}
      </Box>
    </AppLayout>
  );
};

export default ConfigurationsPage;
