// src/components/features/configs/ConfigurationForm.tsx
import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  Stack,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  HelpOutline,
  Code,
  UploadFile,
  Visibility,
} from "@mui/icons-material";
import { FileUpload } from "@/components/ui/FileUpload";
import { GridItem } from "@/components/layout/GridItem";
import CodeEditor from "@/components/ui/CodeEditor";
import VariableForm from "@/components/features/configs/VariableForm";
import { ConfigurationTemplate, Variable } from "@/types/configuration";

/*
interface ConfigurationFormProps {
  onSubmit: (
    data: ConfigurationTemplate,
    files?: { configFile?: File }
  ) => void;
  initialData?: Partial<ConfigurationTemplate>;
  loading?: boolean;
  isEdit?: boolean;
  readOnly?: boolean;
  mode?: "create" | "edit" | "view";
  templateId?: string;
  onCancel?: () => void;
}
  */

interface ConfigurationFormProps {
  onSubmit: (
    data: ConfigurationTemplate,
    files?: { configFile?: File }
  ) => void;
  initialData?: Partial<ConfigurationTemplate>;
  loading?: boolean;
  mode?: "create" | "edit" | "view";
  onCancel?: () => void;
  templateId?: string; // Only if you actually use this
}

const ConfigurationForm = ({
  onSubmit,
  initialData,
  loading = false,
  mode = "create",
  onCancel,
}: ConfigurationFormProps) => {
  const readOnly = mode === "view";
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState<"template" | "file">("template");
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [selectedVariableIndex, setSelectedVariableIndex] = useState<
    number | null
  >(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isMajorVersion, setIsMajorVersion] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm<ConfigurationTemplate>({
    defaultValues: {
      name: "",
      description: "",
      equipmentCategory: "switch",
      vendor: "",
      model: "",
      configType: "basic",
      version: "1.0.0",
      configSourceType: "template",
      variables: [],
      isActive: true,
      approvalRequired: false,
      ...initialData,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "variables",
  });

  const configSourceType = watch("configSourceType");
  const variables = watch("variables");
  const templateContent = watch("template");

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setActiveTab(initialData.configSourceType || "template");
      setIsMajorVersion(initialData.isMajorVersion || false);
    }
  }, [initialData, reset]);

  const checkUndefinedVariables = (template: string, variables: Variable[]) => {
    const variableMatches = template?.match(/\{\{([^}]+)\}\}/g) || [];
    const definedVars = variables.map((v) => v.name);
    return variableMatches
      .map((match) => match.replace(/\{\{|\}\}/g, ""))
      .filter((varName) => !definedVars.includes(varName));
  };

  const applyVariables = (template: string, variables: Variable[]) => {
    return variables.reduce((acc, variable) => {
      return acc.replace(
        new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
        variable.defaultValue || `{{${variable.name}}}`
      );
    }, template || "");
  };

  const handleFormSubmit = (data: ConfigurationTemplate) => {
    clearErrors();

    // Validation logic remains the same
    if (data.configSourceType === "template") {
      if (!data.template?.trim()) {
        setError("template", {
          type: "manual",
          message: "Template content is required",
        });
        return;
      }
      const undefinedVars = checkUndefinedVariables(
        data.template,
        data.variables
      );
      if (undefinedVars.length > 0) {
        setError("template", {
          type: "manual",
          message: `Undefined variables: ${undefinedVars.join(", ")}`,
        });
        return;
      }
    }

    // Pass raw data to parent - let parent handle FormData conversion
    onSubmit(data, configFile ? { configFile } : undefined);
  };

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: "template" | "file"
  ) => {
    setActiveTab(newValue);
    setValue("configSourceType", newValue);
  };

  const handleAddVariable = (variable: Variable) => {
    if (selectedVariableIndex !== null) {
      update(selectedVariableIndex, variable);
    } else {
      append(variable);
    }
    setVariableDialogOpen(false);
    setSelectedVariableIndex(null);
  };

  const handleEditVariable = (index: number) => {
    if (readOnly) return;
    setSelectedVariableIndex(index);
    setVariableDialogOpen(true);
  };

  const handleRemoveVariable = (index: number) => {
    if (readOnly) return;
    remove(index);
  };

  const handleTemplateChange = (value: string) => {
    setValue("template", value);
    if (value.trim()) {
      clearErrors("template");
    }
  };

  const handleFileChange = (file: File | null) => {
    if (readOnly) return;
    setConfigFile(file);
  };

  const validateVariableName = (name: string) => {
    return !variables.some(
      (v, index) =>
        v.name === name &&
        (selectedVariableIndex === null || index !== selectedVariableIndex)
    );
  };

  const renderVariableChips = () => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Variables {!readOnly && "(Click to edit)"}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {fields.map((field, index) => (
          <Chip
            key={field.id}
            label={field.name}
            onClick={() => handleEditVariable(index)}
            onDelete={!readOnly ? () => handleRemoveVariable(index) : undefined}
            color={field.required ? "primary" : "default"}
            variant="outlined"
          />
        ))}
      </Stack>
    </Box>
  );

  const renderTemplateTab = () => (
    <Box>
      {renderVariableChips()}

      {!readOnly && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setVariableDialogOpen(true)}
          sx={{ mb: 3 }}
        >
          Add Variable
        </Button>
      )}

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1">Template Content</Typography>
          <Tooltip title="Use {{variable}} syntax to insert variables">
            <IconButton size="small">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Controller
          name="template"
          control={control}
          rules={{
            required:
              configSourceType === "template"
                ? "Template content is required"
                : false,
            validate: (value) => {
              if (configSourceType !== "template") return true;
              const undefinedVars = checkUndefinedVariables(
                value || "",
                variables
              );
              return (
                undefinedVars.length === 0 ||
                `Undefined variables: ${undefinedVars.join(", ")}`
              );
            },
          }}
          render={({ field }) => (
            <>
              <CodeEditor
                value={field.value || ""}
                onChange={handleTemplateChange}
                language="text"
                height="400px"
                readOnly={readOnly}
              />
              {errors.template && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.template.message}
                </Alert>
              )}
            </>
          )}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setPreviewOpen(true)}
          startIcon={<Visibility />}
        >
          Preview Template
        </Button>
      </Box>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          <CodeEditor
            value={applyVariables(templateContent || "", variables)}
            language="text"
            height="500px"
            readOnly={true}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );

  const renderFileTab = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {readOnly ? "Configuration File" : "Upload Configuration File"}
      </Typography>

      {!readOnly && (
        <FileUpload
          accept="*"
          onChange={handleFileChange}
          maxSize={10 * 1024 * 1024} // 10MB
        />
      )}

      {configFile && (
        <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
          <Chip
            label={configFile.name}
            onDelete={!readOnly ? () => setConfigFile(null) : undefined}
            sx={{ mr: 2 }}
          />
          <Typography variant="body2">
            {(configFile.size / 1024).toFixed(2)} KB
          </Typography>
        </Box>
      )}

      {initialData?.configFile && !configFile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Current file: {initialData.configFile.originalName}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      {errors.root && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.root.message}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Name *"
              fullWidth
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Description"
              fullWidth
              {...register("description")}
              multiline
              rows={2}
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControl fullWidth error={!!errors.equipmentCategory}>
              <InputLabel>Equipment Category *</InputLabel>
              <Select
                label="Equipment Category *"
                {...register("equipmentCategory", {
                  required: "Equipment category is required",
                })}
                disabled={readOnly}
              >
                <MenuItem value="switch">Switch</MenuItem>
                <MenuItem value="router">Router</MenuItem>
                <MenuItem value="firewall">Firewall</MenuItem>
                <MenuItem value="ap">Access Point</MenuItem>
                <MenuItem value="server">Server</MenuItem>
              </Select>
              {errors.equipmentCategory && (
                <FormHelperText>
                  {errors.equipmentCategory.message}
                </FormHelperText>
              )}
            </FormControl>
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Vendor *"
              fullWidth
              {...register("vendor", { required: "Vendor is required" })}
              error={!!errors.vendor}
              helperText={errors.vendor?.message}
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Model *"
              fullWidth
              {...register("model", { required: "Model is required" })}
              error={!!errors.model}
              helperText={errors.model?.message}
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControl fullWidth error={!!errors.configType}>
              <InputLabel>Configuration Type *</InputLabel>
              <Select
                label="Configuration Type *"
                {...register("configType", {
                  required: "Configuration type is required",
                })}
                disabled={readOnly}
              >
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="vlan">VLAN</MenuItem>
                <MenuItem value="routing">Routing</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="qos">QoS</MenuItem>
                <MenuItem value="ha">High Availability</MenuItem>
                <MenuItem value="snmp">SNMP</MenuItem>
                <MenuItem value="ntp">NTP</MenuItem>
                <MenuItem value="syslog">Syslog</MenuItem>
                <MenuItem value="interface">Interface</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
              {errors.configType && (
                <FormHelperText>{errors.configType.message}</FormHelperText>
              )}
            </FormControl>
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Version *"
              fullWidth
              {...register("version", {
                required: "Version is required",
                pattern: {
                  value: /^\d+\.\d+\.\d+$/,
                  message: "Must be in semantic version format (e.g., 1.0.0)",
                },
              })}
              error={!!errors.version}
              helperText={errors.version?.message}
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControlLabel
              control={
                <Switch
                  {...register("isActive")}
                  defaultChecked
                  disabled={readOnly}
                />
              }
              label="Active"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControlLabel
              control={
                <Switch {...register("approvalRequired")} disabled={readOnly} />
              }
              label="Approval Required"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isMajorVersion}
                  onChange={(e) => setIsMajorVersion(e.target.checked)}
                  disabled={readOnly}
                />
              }
              label="Major Version Update"
              sx={{ mb: 1 }}
            />
            <Tooltip title="Check this if the changes are not backward compatible">
              <HelpOutline fontSize="small" color="action" />
            </Tooltip>
          </GridItem>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Configuration Source</Typography>
          {!readOnly && (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="configuration source tabs"
            >
              <Tab
                label="Template"
                value="template"
                icon={<Code />}
                iconPosition="start"
                disabled={readOnly}
              />
              <Tab
                label="File"
                value="file"
                icon={<UploadFile />}
                iconPosition="start"
                disabled={readOnly}
              />
            </Tabs>
          )}
        </Box>
        <Divider sx={{ mb: 3 }} />
        {activeTab === "template" ? renderTemplateTab() : renderFileTab()}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compatibility
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Specific Device Models (comma separated)"
              fullWidth
              {...register("specificDeviceModels")}
              placeholder="e.g., Cisco Catalyst 9300, Juniper EX4300"
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Compatible OS Versions (comma separated)"
              fullWidth
              {...register("compatibility.osVersions")}
              placeholder="e.g., IOS 15.2, Junos 18.4"
              disabled={readOnly}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Compatible Firmware Versions (comma separated)"
              fullWidth
              {...register("compatibility.firmwareVersions")}
              placeholder="e.g., 1.0.1, 2.3.5"
              disabled={readOnly}
            />
          </GridItem>
        </Box>
      </Paper>

      {/*
      {!readOnly && (
        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              "Update Configuration"
            ) : (
              "Create Configuration"
            )}
          </Button>
        </Box>
      )}
        */}

      {mode !== "view" && (
        <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              "Update Configuration"
            ) : (
              "Create Configuration"
            )}
          </Button>
        </Box>
      )}

      <VariableForm
        open={variableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        onSubmit={handleAddVariable}
        initialData={
          selectedVariableIndex !== null
            ? variables[selectedVariableIndex]
            : undefined
        }
        onValidate={validateVariableName}
      />
    </Box>
  );
};

export default ConfigurationForm;
