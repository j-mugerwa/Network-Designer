// src/components/features/teams/CreateTeamForm.tsx
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { createTeam, clearTeamError } from "@/store/slices/teamSlice";
import {
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

const CreateTeamForm: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { processing, error } = useAppSelector((state) => ({
    processing: state.team.processing,
    error: state.team.error,
  }));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /*
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createTeam(formData));
    if (createTeam.fulfilled.match(result)) {
      setFormData({ name: "", description: "" });
      if (onSuccess) onSuccess();
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      createTeam({
        name: formData.name,
        description: formData.description,
        // Add members if needed
        //members: [], // member selection logic
      })
    );

    if (createTeam.fulfilled.match(result)) {
      setFormData({ name: "", description: "" });
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Create New Team
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => dispatch(clearTeamError())}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        margin="normal"
        label="Team Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        inputProps={{ maxLength: 50 }}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Description (Optional)"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={3}
        inputProps={{ maxLength: 500 }}
      />

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={processing || !formData.name}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          Create Team
        </Button>
      </Box>
    </Box>
  );
};

export default CreateTeamForm;
