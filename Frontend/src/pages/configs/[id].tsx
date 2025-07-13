import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTemplateById,
  updateConfigurationTemplate,
  selectCurrentTemplate,
  selectTemplateLoading,
  selectTemplateError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import type { AppDispatch } from "@/store/store";
import ConfigurationForm from "@/components/features/configs/ConfigurationForm";
import { Alert, CircularProgress, Box } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const ConfigurationDetailPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = router.query;
  const currentTemplate = useSelector(selectCurrentTemplate);
  const loading = useSelector(selectTemplateLoading);
  const error = useSelector(selectTemplateError);
  const isEditMode = router.query.mode === "edit";

  useEffect(() => {
    if (id) {
      dispatch(fetchTemplateById(id as string));
    }
    return () => {
      dispatch(clearConfigurationError());
    };
  }, [id, dispatch]);

  const handleSubmit = async (data: any, files?: { configFile?: File }) => {
    if (!id) return;

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === "variables" || key === "compatibility") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (files?.configFile) {
      formData.append("file", files.configFile);
    }

    try {
      const result = await dispatch(
        updateConfigurationTemplate({
          id: id as string,
          formData,
        })
      );

      if (updateConfigurationTemplate.fulfilled.match(result)) {
        router.push(`/configs/${id}`);
      }
    } catch (error) {
      console.error("Failed to update configuration:", error);
    }
  };

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  return (
    <AppLayout title={currentTemplate?.name || "Configuration"}>
      <Box sx={{ p: 4 }}>
        <PageHeader
          title={currentTemplate?.name || "Configuration"}
          subtitle={
            isEditMode
              ? "Edit configuration template"
              : "View configuration details"
          }
          breadcrumbs={[
            { label: "Configurations", href: "/configs" },
            {
              label: currentTemplate?.name || "Details",
              href: `/configs/${id}`,
            },
          ]}
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <ConfigurationForm
            onSubmit={handleSubmit}
            initialData={currentTemplate}
            isEdit={isEditMode}
            readOnly={!isEditMode}
          />
        )}
      </Box>
    </AppLayout>
  );
};

export default ConfigurationDetailPage;
