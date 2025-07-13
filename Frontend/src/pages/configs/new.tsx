import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  createConfigurationTemplate,
  selectTemplateCreating,
  selectTemplateError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import type { AppDispatch } from "@/store/store";
import ConfigurationForm from "@/components/features/configs/ConfigurationForm";
import { Alert, CircularProgress, Box } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const CreateConfigurationPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const creating = useSelector(selectTemplateCreating);
  const error = useSelector(selectTemplateError);

  const handleSubmit = async (data: any, files?: { configFile?: File }) => {
    const formData = new FormData();

    // Append all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === "variables" || key === "compatibility") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Append file if file-based config
    if (files?.configFile) {
      formData.append("file", files.configFile);
    }

    try {
      const result = await dispatch(createConfigurationTemplate(formData));
      if (createConfigurationTemplate.fulfilled.match(result)) {
        router.push("/configs");
      }
    } catch (error) {
      console.error("Failed to create configuration:", error);
    }
  };

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  return (
    <AppLayout title="Create Configuration Template">
      <Box sx={{ p: 4 }}>
        <PageHeader
          title="Create Configuration Template"
          subtitle="Add a new configuration template for your network devices"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {creating ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <ConfigurationForm onSubmit={handleSubmit} />
        )}
      </Box>
    </AppLayout>
  );
};

export default CreateConfigurationPage;
