// src/components/features/configs/DeploymentForm.tsx
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
} from "@mui/material";
import {
  Save,
  Cancel,
  ArrowBack,
  Link as LinkIcon,
  Description,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  deployConfiguration,
  selectCurrentTemplate,
  fetchTemplateById,
  selectTemplateLoading,
  selectTemplateError,
  clearConfigurationError,
} from "@/store/slices/configurationSlice";
import {
  fetchUserEquipment,
  selectUserEquipment,
} from "@/store/slices/equipmentSlice";
import { Equipment } from "@/types/equipment";
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
  onSubmit: (data: {
    templateId: string;
    deviceId: string;
    variables: Record<string, string>;
    notes: string;
  }) => Promise<void>;
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({ templateId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentTemplate = useAppSelector(selectCurrentTemplate);
  const loading = useAppSelector(selectTemplateLoading);
  const error = useAppSelector(selectTemplateError);
  const userDevices = useAppSelector(selectUserEquipment);

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

  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );

  // Load template if pre-filled
  useEffect(() => {
    if (templateId) {
      dispatch(fetchTemplateById(templateId));
      setValue("templateId", templateId);
    }
  }, [templateId, dispatch, setValue]);

  // Load user's devices
  useEffect(() => {
    dispatch(fetchUserEquipment());
  }, [dispatch]);

  // Initialize variable values from template
  useEffect(() => {
    if (currentTemplate?.variables) {
      const initialValues: Record<string, string> = {};
      currentTemplate.variables.forEach((variable) => {
        initialValues[variable.name] = variable.defaultValue || "";
      });
      setVariableValues(initialValues);
      setValue("variables", initialValues);
    }
  }, [currentTemplate, setValue]);

  const onSubmit: SubmitHandler<DeploymentFormData> = async (data) => {
    try {
      await dispatch(
        deployConfiguration({
          templateId: data.templateId,
          deviceId: data.deviceId,
          variables: data.variables,
          notes: data.notes,
        })
      ).unwrap();

      router.push("/deployments");
    } catch (error) {
      console.error("Deployment failed:", error);
    }
  };

  const handleVariableChange = (name: string, value: string) => {
    const newValues = { ...variableValues, [name]: value };
    setVariableValues(newValues);
    setValue("variables", newValues);
  };

  const getDeviceLabel = (device: Equipment) => {
    return `${device.model} (${device.ipAddress}) - ${device.manufacturer}`;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Deploy Configuration</Typography>
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <GridItem sx={{ width: { xs: "100%", md: "66%" } }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <GridItem>
                    <Controller
                      name="templateId"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          options={currentTemplate ? [currentTemplate] : []}
                          getOptionLabel={(option) => option.name}
                          value={currentTemplate || null}
                          onChange={(_, value) => {
                            field.onChange(value?._id || "");
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Configuration Template"
                              error={!!errors.templateId}
                              helperText={errors.templateId?.message}
                              disabled={!!templateId}
                            />
                          )}
                          disabled={!!templateId}
                        />
                      )}
                    />
                  </GridItem>

                  <GridItem>
                    <Controller
                      name="deviceId"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          options={userDevices}
                          getOptionLabel={getDeviceLabel}
                          onChange={(_, value) => {
                            field.onChange(value?.id || "");
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Device"
                              error={!!errors.deviceId}
                              helperText={errors.deviceId?.message}
                              required
                            />
                          )}
                        />
                      )}
                    />
                  </GridItem>

                  {currentTemplate?.variables &&
                    currentTemplate.variables.length > 0 && (
                      <GridItem>
                        <Typography variant="h6" gutterBottom>
                          Configuration Variables
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                          {currentTemplate.variables.map((variable) => (
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
                                helperText={variable.description}
                              />
                            </GridItem>
                          ))}
                        </Box>
                      </GridItem>
                    )}

                  <GridItem>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          label="Deployment Notes"
                          placeholder="Add any additional notes about this deployment"
                        />
                      )}
                    />
                  </GridItem>
                </Box>
              </CardContent>
            </Card>
          </GridItem>

          <GridItem sx={{ width: { xs: "100%", md: "33%" } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Deployment Summary
                </Typography>

                {currentTemplate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Template:</Typography>
                    <Typography>{currentTemplate.name}</Typography>

                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Type:
                    </Typography>
                    <Chip label={currentTemplate.configType} size="small" />

                    {watch("deviceId") && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }}>
                          Device:
                        </Typography>
                        <Typography>
                          {
                            userDevices.find((d) => d.id === watch("deviceId"))
                              ?.model
                          }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {
                            userDevices.find((d) => d.id === watch("deviceId"))
                              ?.ipAddress
                          }
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<LinkIcon />}
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Deploy"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </GridItem>
        </Box>
      </form>
    </Box>
  );
};

export default DeploymentForm;
