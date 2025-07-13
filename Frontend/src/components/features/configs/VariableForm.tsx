// src/components/configuration/VariableForm.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";

interface VariableFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  onValidate?: (name: string) => boolean; //Optional
}

const VariableForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
}: VariableFormProps) => {
  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      defaultValue: "",
      required: false,
      validationRegex: "",
      example: "",
      dataType: "string",
      options: [] as string[],
      scope: "global",
      ...initialData,
    },
  });

  const dataType = watch("dataType");
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleAddOption = () => {
    if (optionInput && !watch("options").includes(optionInput)) {
      setValue("options", [...watch("options"), optionInput]);
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setValue(
      "options",
      watch("options").filter((o: string) => o !== option)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Edit Variable" : "Add New Variable"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Variable Name *"
              fullWidth
              {...register("name", {
                required: "Variable name is required",
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message:
                    "Only alphanumeric characters and underscores allowed",
                },
              })}
              error={!!errors.name}
              helperText={errors.name?.message as string}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Description *"
              fullWidth
              {...register("description", {
                required: "Description is required",
              })}
              error={!!errors.description}
              helperText={errors.description?.message as string}
              multiline
              rows={2}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Switch {...register("required")} />}
              label="Required"
            />
          </Box>

          {!watch("required") && (
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Default Value"
                fullWidth
                {...register("defaultValue")}
                error={!!errors.defaultValue}
                helperText={errors.defaultValue?.message as string}
              />
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Data Type *</InputLabel>
              <Controller
                name="dataType"
                control={control}
                defaultValue="string"
                render={({ field }) => (
                  <Select label="Data Type *" {...field}>
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="ip">IP Address</MenuItem>
                    <MenuItem value="cidr">CIDR</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="select">Select</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Box>

          {dataType === "select" && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Options
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add option"
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={handleAddOption}
                  disabled={!optionInput}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {watch("options").map((option: string) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => handleRemoveOption(option)}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Validation Regex"
              fullWidth
              {...register("validationRegex")}
              error={!!errors.validationRegex}
              helperText={errors.validationRegex?.message as string}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Example"
              fullWidth
              {...register("example")}
              error={!!errors.example}
              helperText={errors.example?.message as string}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Scope *</InputLabel>
              <Controller
                name="scope"
                control={control}
                defaultValue="global"
                render={({ field }) => (
                  <Select label="Scope *" {...field}>
                    <MenuItem value="global">Global</MenuItem>
                    <MenuItem value="device">Device</MenuItem>
                    <MenuItem value="interface">Interface</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {initialData ? "Update Variable" : "Add Variable"}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VariableForm;
