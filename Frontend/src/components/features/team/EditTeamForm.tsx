// src/components/features/teams/EditTeamForm.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  updateTeam,
  clearTeamError,
  selectCurrentTeam,
} from "@/store/slices/teamSlice";
import {
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/router";

interface EditTeamFormProps {
  teamId: string;
  onSuccess?: () => void;
}

const EditTeamForm: React.FC<EditTeamFormProps> = ({ teamId, onSuccess }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { processing, error } = useAppSelector((state) => ({
    processing: state.team.processing,
    error: state.team.error,
  }));
  const currentTeam = useAppSelector(selectCurrentTeam);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Load team data when component mounts or teamId changes
  useEffect(() => {
    if (currentTeam && currentTeam.id === teamId) {
      setFormData({
        name: currentTeam.name || "",
        description: currentTeam.description || "",
      });
    }
  }, [currentTeam, teamId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const result = await dispatch(
      updateTeam({
        teamId,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
      })
    );

    if (updateTeam.fulfilled.match(result)) {
      if (onSuccess) {
        onSuccess();
      } else {
        // Default success behavior - redirect to teams page
        router.push("/team");
      }
    }
  };

  const handleCancel = () => {
    router.push("/team");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Edit Team
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

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button variant="outlined" onClick={handleCancel} disabled={processing}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={processing || !formData.name.trim()}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          Update Team
        </Button>
      </Box>
    </Box>
  );
};

export default EditTeamForm;
