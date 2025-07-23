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
import { Alert, CircularProgress, Box, Button, Paper } from "@mui/material";
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

  /*
  const handleSubmit = async (data: any, files?: { configFile?: File }) => {
    if (!id) return;

    try {
      const formData = new FormData();
      formData.append("config", JSON.stringify(data));

      if (files?.configFile) {
        formData.append("configFile", files.configFile);
      }

      const result = await dispatch(
        updateConfigurationTemplate({
          id: id as string,
          formData,
        })
      ).unwrap();

      if (result) {
        router.push(`/configs/${id}`);
      }
    } catch (error) {
      console.error("Failed to update configuration:", error);
    }
  };
  */

  const handleSubmit = async (data: any, files?: { configFile?: File }) => {
    if (!id) return;

    try {
      const formData = new FormData();
      //formData.append("config", JSON.stringify(data));

      formData.append(
        "config",
        JSON.stringify({
          ...data,
          _id: id, //Include the ID
        })
      );

      if (files?.configFile) {
        formData.append("configFile", files.configFile);
      }

      const result = await dispatch(
        updateConfigurationTemplate({
          id: id as string,
          formData, // Changed from 'data' to 'formData'
        })
      ).unwrap();

      if (result) {
        router.push(`/configs/${id}`);
      }
    } catch (error) {
      console.error("Failed to update configuration:", error);
    }
  };

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  const handleEditClick = () => {
    router.push(`/configs/${id}?mode=edit`);
  };

  const handleCancelEdit = () => {
    router.push(`/configs/${id}`);
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

        <Paper elevation={1} sx={{ p: 1, mb: 3 }}>
          {!isEditMode && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditClick}
              >
                Edit Configuration
              </Button>
            </Box>
          )}
        </Paper>

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
          currentTemplate && (
            <ConfigurationForm
              onSubmit={handleSubmit}
              initialData={currentTemplate}
              mode={isEditMode ? "edit" : "view"}
              loading={loading}
              onCancel={isEditMode ? handleCancelEdit : undefined}
            />
          )
        )}
      </Box>
    </AppLayout>
  );
};

export default ConfigurationDetailPage;
