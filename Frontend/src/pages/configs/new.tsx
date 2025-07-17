// src/pages/configs/new.tsx
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
import { ConfigurationTemplate } from "@/types/configuration";

const CreateConfigurationPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const creating = useSelector(selectTemplateCreating);
  const error = useSelector(selectTemplateError);

  //Handle submition
  /*
  const handleSubmit = async (
    data: ConfigurationTemplate,
    files?: { configFile?: File }
  ) => {
    try {
      // Create a plain object instead of FormData
      const payload: any = {
        ...data,
        // Process compatibility fields
        compatibility: data.compatibility
          ? {
              ...data.compatibility,
              osVersions: data.compatibility.osVersions
                ? processVersionString(
                    data.compatibility.osVersions,
                    /^[\w\s.-]+$/
                  )
                : undefined,
              firmwareVersions: data.compatibility.firmwareVersions
                ? processVersionString(
                    data.compatibility.firmwareVersions,
                    /^[\w.-]+$/
                  )
                : undefined,
            }
          : undefined,
        // Process device models
        specificDeviceModels: data.specificDeviceModels
          ? processVersionString(data.specificDeviceModels, /^[\w\s.-]+$/)
          : undefined,
      };

      // Create FormData
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));

      if (files?.configFile) {
        formData.append("configFile", files.configFile);
      }

      const result = await dispatch(createConfigurationTemplate(formData));
      if (createConfigurationTemplate.fulfilled.match(result)) {
        router.push("/configs");
      }
    } catch (error) {
      console.error("Failed to create configuration:", error);
    }
  };
  */

  const handleSubmit = async (
    data: ConfigurationTemplate,
    files?: { configFile?: File }
  ) => {
    try {
      // 1. Prepare the payload with proper formatting
      const payload = {
        ...data,
        // Process compatibility fields
        compatibility: data.compatibility
          ? {
              osVersions: processVersions(
                data.compatibility.osVersions,
                /^[\w\s.-]+$/
              ),
              firmwareVersions: processVersions(
                data.compatibility.firmwareVersions,
                /^[\w.-]+$/
              ),
            }
          : undefined,
        // Process device models
        specificDeviceModels: processVersions(
          data.specificDeviceModels,
          /^[\w\s.-]+$/
        ),
      };

      // 2. Create FormData and append the JSON payload
      const formData = new FormData();
      formData.append("config", JSON.stringify(payload));

      // 3. Append file if exists
      if (files?.configFile) {
        formData.append("configFile", files.configFile);
      }

      // 4. Submit the request
      const result = await dispatch(createConfigurationTemplate(formData));
      if (createConfigurationTemplate.fulfilled.match(result)) {
        router.push("/configs");
      }
    } catch (error) {
      console.error("Configuration creation failed:", error);
      // Add your error handling UI here
    }
  };

  // Universal version processor
  const processVersions = (
    input: string | string[] | undefined,
    regex: RegExp
  ): string[] => {
    if (!input) return [];

    const versions =
      typeof input === "string"
        ? input
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v)
        : Array.isArray(input)
        ? input.map((v) => String(v).trim())
        : [];

    return versions.filter((v) => regex.test(v));
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
