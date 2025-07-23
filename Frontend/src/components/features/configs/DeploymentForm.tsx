import React, { useEffect, useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  Chip,
  Stack,
  IconButton,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack,
  Link as LinkIcon,
  Description,
  Info,
  Computer,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  deployConfiguration,
  selectCurrentTemplate,
  fetchTemplateById,
  selectTemplateLoading,
  selectDeploymentStatus,
  selectTemplateError,
  clearConfigurationError,
  resetCurrentTemplate,
  setCurrentTemplate,
} from "@/store/slices/configurationSlice";
import {
  fetchUserEquipment,
  selectUserEquipment,
} from "@/store/slices/equipmentSlice";
import { Equipment } from "@/types/equipment";
import { ConfigurationTemplate } from "@/types/configuration";
import { GridItem } from "@/components/layout/GridItem";

interface DeploymentFormData {
  templateId: string;
  deviceId: string;
  variables: Record<string, string>;
  notes: string;
  file?: File;
}

const schema = yup.object().shape({
  templateId: yup.string().required("Configuration is required"),
  deviceId: yup.string().required("Device is required"),
  variables: yup.object().default({}),
  notes: yup.string().default(""),
});

interface DeploymentFormProps {
  templateId?: string;
  onSubmit: (data: DeploymentFormData) => Promise<void>;
  availableTemplates?: ConfigurationTemplate[];
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({
  templateId,
  onSubmit,
  availableTemplates = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const currentTemplate = useAppSelector(selectCurrentTemplate);
  const loading = useAppSelector(selectTemplateLoading);
  const error = useAppSelector(selectTemplateError);
  const userDevices = useAppSelector(selectUserEquipment);
  const deploymentStatus = useAppSelector(
    selectDeploymentStatus(templateId || undefined)
  );

  // Local state
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [compatibilityError, setCompatibilityError] = useState<string | null>(
    null
  );
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeploymentFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      templateId: templateId || "",
      deviceId: "",
      variables: {},
      notes: "",
    },
  });

  const selectedDeviceId = watch("deviceId");
  const formTemplateId = watch("templateId");

  // Check device-template compatibility
  const checkCompatibility = (
    template: ConfigurationTemplate,
    device: Equipment
  ): boolean => {
    return template.equipmentCategory === device.category;
  };

  // Effects
  useEffect(() => {
    if (currentTemplate && selectedDeviceId) {
      const device = userDevices.find((d) => d.id === selectedDeviceId);
      if (device) {
        const isCompatible = checkCompatibility(currentTemplate, device);
        setCompatibilityError(
          isCompatible
            ? null
            : `Selected device (${device.category}) is incompatible with template (requires ${currentTemplate.equipmentCategory})`
        );
      }
    } else {
      setCompatibilityError(null);
    }
  }, [currentTemplate, selectedDeviceId, userDevices]);

  useEffect(() => {
    dispatch(fetchUserEquipment());
  }, [dispatch]);

  // Initialize template and variables
  useEffect(() => {
    if (templateId && !initialLoadComplete) {
      const id = Array.isArray(templateId) ? templateId[0] : templateId;
      if (id) {
        const existingTemplate = availableTemplates.find(
          (t) => t._id === id || t.id === id
        );

        if (existingTemplate) {
          dispatch(setCurrentTemplate(existingTemplate));
          setValue("templateId", id);
          initializeVariables(existingTemplate);
        } else {
          dispatch(fetchTemplateById(id))
            .unwrap()
            .then((template) => {
              initializeVariables(template);
            })
            .catch((error) => {
              console.error("Failed to load template:", error);
              router.push("/configs");
            });
        }
        setInitialLoadComplete(true);
      }
    } else if (!templateId && currentTemplate) {
      dispatch(resetCurrentTemplate());
      setVariableValues({});
      setValue("templateId", "");
      setInitialLoadComplete(true);
    }
  }, [templateId, availableTemplates, dispatch, setValue, router]);

  const initializeVariables = (template: ConfigurationTemplate) => {
    if (template?.variables) {
      const initialValues = template.variables.reduce(
        (acc, variable) => ({
          ...acc,
          [variable.name]: variable.defaultValue || "",
        }),
        {}
      );
      setVariableValues(initialValues);
      setValue("variables", initialValues);
    }
  };

  // Handlers
  const handleVariableChange = (name: string, value: string) => {
    const newValues = { ...variableValues, [name]: value };
    setVariableValues(newValues);
    setValue("variables", newValues);
  };

  const handleTemplateChange = (template: ConfigurationTemplate | null) => {
    const templateId = template?._id || template?.id || "";
    setValue("templateId", templateId);
    if (template) {
      dispatch(setCurrentTemplate(template));
      initializeVariables(template);
    } else {
      dispatch(resetCurrentTemplate());
      setVariableValues({});
    }
  };

  const handleDeploy: SubmitHandler<DeploymentFormData> = async (data) => {
    try {
      await onSubmit(data);
      router.push("/configs");
    } catch (error) {
      console.error("Deployment failed:", error);
    }
  };

  const getDeviceLabel = (device: Equipment) => {
    return `${device.model} (${device.ipAddress || "No IP"}) - ${
      device.manufacturer
    }`;
  };

  // Get the displayed template (either from currentTemplate or availableTemplates)
  const displayedTemplate: ConfigurationTemplate | undefined =
    currentTemplate ||
    (formTemplateId
      ? availableTemplates.find(
          (t) => t._id === formTemplateId || t.id === formTemplateId
        )
      : undefined);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>

        <Typography variant="h4" fontWeight="bold" color="primary">
          Deploy
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => dispatch(clearConfigurationError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {compatibilityError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {compatibilityError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleDeploy)}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Form Inputs Column */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 3,
            }}
          >
            {/* Left Side - Form Inputs */}
            <Box
              sx={{
                flex: 2,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Configuration Template */}
              <GridItem>
                <Card elevation={2} sx={{ width: "100%" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Configuration Template
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    {/* Configuration Template Autocomplete */}
                    <FormControl fullWidth>
                      <Controller
                        name="templateId"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            options={availableTemplates}
                            getOptionLabel={(option) => option.name}
                            value={displayedTemplate || null}
                            onChange={(_, value) => {
                              handleTemplateChange(value);
                              field.onChange(value?._id || value?.id || "");
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select configuration template"
                                error={!!errors.templateId}
                                helperText={
                                  errors.templateId?.message ||
                                  (displayedTemplate
                                    ? displayedTemplate.description
                                    : undefined)
                                }
                                disabled={!!templateId}
                              />
                            )}
                            disabled={!!templateId}
                            isOptionEqualToValue={(option, value) =>
                              (option._id || option.id) ===
                              (value?._id || value?.id)
                            }
                          />
                        )}
                      />
                    </FormControl>
                  </CardContent>
                </Card>
              </GridItem>

              {/* Target Device */}
              <GridItem>
                <Card elevation={2} sx={{ width: "100%" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Computer color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Target Device
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <FormControl fullWidth>
                      <Controller
                        name="deviceId"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            options={userDevices}
                            getOptionLabel={getDeviceLabel}
                            onChange={(_, value) =>
                              field.onChange(value?.id || "")
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select target device"
                                error={!!errors.deviceId}
                                helperText={errors.deviceId?.message}
                                required
                              />
                            )}
                          />
                        )}
                      />
                      {displayedTemplate && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Compatible with: {displayedTemplate.equipmentCategory}{" "}
                          devices
                        </Typography>
                      )}
                    </FormControl>
                  </CardContent>
                </Card>
              </GridItem>

              {/* Configuration Variables */}
              {displayedTemplate?.variables &&
                displayedTemplate.variables.length > 0 && (
                  <GridItem>
                    <Card elevation={2} sx={{ width: "100%" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Info color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Configuration Variables
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Please fill in the required configuration variables
                        </Typography>

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                          {displayedTemplate.variables.map((variable) => (
                            <GridItem
                              key={variable.name}
                              sx={{
                                width: { xs: "100%", sm: "calc(50% - 16px)" },
                              }}
                            >
                              <TextField
                                fullWidth
                                label={variable.name}
                                value={variableValues[variable.name] || ""}
                                onChange={(e) =>
                                  handleVariableChange(
                                    variable.name,
                                    e.target.value
                                  )
                                }
                                helperText={
                                  <Box
                                    component="span"
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Info fontSize="small" sx={{ mr: 0.5 }} />
                                    {variable.description}
                                    {variable.example &&
                                      ` (e.g. ${variable.example})`}
                                  </Box>
                                }
                                required={variable.required}
                                sx={{ mb: 1 }}
                              />
                            </GridItem>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </GridItem>
                )}

              {/* Deployment Notes */}
              <GridItem>
                <Card elevation={2} sx={{ width: "100%" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Deployment Notes
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Additional notes"
                          placeholder="Enter any notes about this deployment (optional)"
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </GridItem>
            </Box>

            {/* Right Side - Summary and Actions */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Deployment Summary */}
              <GridItem>
                <Card elevation={2} sx={{ width: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Deployment Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {displayedTemplate ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* Template Summary */}
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            CONFIGURATION
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <CheckCircle
                              color="primary"
                              sx={{ mr: 1, fontSize: 16 }}
                            />
                            <Typography variant="body1" fontWeight={500}>
                              {displayedTemplate.name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={displayedTemplate.configType}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={displayedTemplate.equipmentCategory}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>

                        {/* Device Summary */}
                        {selectedDeviceId &&
                          userDevices.find(
                            (d) => d.id === selectedDeviceId
                          ) && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                              >
                                TARGET DEVICE
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Computer
                                  color="primary"
                                  sx={{ mr: 1, fontSize: 16 }}
                                />
                                <Typography variant="body1" fontWeight={500}>
                                  {
                                    userDevices.find(
                                      (d) => d.id === selectedDeviceId
                                    )?.model
                                  }
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                IP:{" "}
                                {userDevices.find(
                                  (d) => d.id === selectedDeviceId
                                )?.ipAddress || "Not specified"}
                              </Typography>
                            </Box>
                          )}

                        {/* Variables Summary */}
                        {displayedTemplate.variables?.length > 0 && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              CONFIGURATION VARIABLES
                            </Typography>
                            <Box
                              sx={{
                                maxHeight: 200,
                                overflowY: "auto",
                                p: 1,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 1,
                              }}
                            >
                              {displayedTemplate.variables.map((variable) => (
                                <Box key={variable.name} sx={{ mb: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {variable.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {variableValues[variable.name] || (
                                      <em>Not set</em>
                                    )}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {loading
                          ? "Loading template..."
                          : "Select a configuration template to see deployment details"}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </GridItem>

              {/* Action Buttons */}
              <GridItem>
                <Card elevation={2} sx={{ width: "100%" }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="flex-end"
                    >
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={() => router.back()}
                        size="large"
                        fullWidth={isMobile}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<LinkIcon />}
                        disabled={
                          deploymentStatus.loading ||
                          !!compatibilityError ||
                          !currentTemplate || // Disable if template not loaded
                          !selectedDeviceId // Disable if device not selected
                        }
                        size="large"
                        fullWidth={isMobile}
                        sx={{ minWidth: 120 }}
                      >
                        {deploymentStatus.loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Deploy"
                        )}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </GridItem>
            </Box>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default DeploymentForm;
