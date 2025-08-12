import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  deployConfiguration,
  selectTemplateDeploying as selectDeploymentLoading,
  selectTemplateError as selectDeploymentError,
  clearConfigurationError,
  fetchTemplateById,
  selectCurrentTemplate,
} from "@/store/slices/configurationSlice";
import DeploymentForm from "@/components/features/configs/DeploymentForm";
import { Alert, CircularProgress, Box, Button } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const DeployConfigurationPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { templateId } = router.query;
  const deploying = useAppSelector(selectDeploymentLoading);
  const error = useAppSelector(selectDeploymentError);
  const template = useAppSelector(selectCurrentTemplate);

  useEffect(() => {
    if (templateId) {
      const id = Array.isArray(templateId) ? templateId[0] : templateId;
      if (id) {
        dispatch(fetchTemplateById(id));
      } else {
        console.error("Invalid template ID:", templateId);
        router.push("/configs");
      }
    }
  }, [templateId, dispatch, router]);

  const handleSubmit = async (data: {
    templateId: string;
    deviceId: string;
    variables: Record<string, string>;
    notes: string;
  }) => {
    try {
      const result = await dispatch(
        deployConfiguration({
          templateId: data.templateId,
          deviceId: data.deviceId,
          variables: data.variables,
          notes: data.notes,
        })
      ).unwrap();

      if (result) {
        router.push("/configs");
      }
    } catch (error) {
      console.error("Failed to deploy configuration:", error);
    }
  };

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  const handleBack = () => {
    router.push("/configs");
  };

  return (
    <AppLayout title="Deploy Configuration">
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Button onClick={handleBack} variant="outlined">
            Back to Configurations
          </Button>
        </Box>

        <PageHeader
          title={`Deploy: ${template?.name || "Configuration"}`}
          subtitle={
            template?.description || "Deploy this configuration to a device"
          }
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {deploying ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <DeploymentForm
            templateId={Array.isArray(templateId) ? templateId[0] : templateId}
            onSubmit={handleSubmit}
          />
        )}
      </Box>
    </AppLayout>
  );
};

export default DeployConfigurationPage;
