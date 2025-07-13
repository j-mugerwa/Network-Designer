// src/pages/configs/deploy/[templateId].tsx
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  deployConfiguration,
  selectTemplateDeploying as selectDeploymentLoading,
  selectTemplateError as selectDeploymentError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import DeploymentForm from "@/components/features/configs/DeploymentForm";
import { Alert, CircularProgress, Box } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const DeployConfigurationPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const deploying = useSelector(selectDeploymentLoading);
  const error = useSelector(selectDeploymentError);
  const { templateId } = router.query;

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
      );

      if (deployConfiguration.fulfilled.match(result)) {
        router.push("/deployments");
      }
    } catch (error) {
      console.error("Failed to deploy configuration:", error);
    }
  };

  const handleClearError = () => {
    dispatch(clearConfigurationError());
  };

  return (
    <AppLayout title="Deploy Configuration">
      <Box sx={{ p: 4 }}>
        <PageHeader
          title="Deploy Configuration"
          subtitle="Deploy a configuration template to your network device"
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
