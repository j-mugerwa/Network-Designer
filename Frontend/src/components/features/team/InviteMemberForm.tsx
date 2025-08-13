import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { inviteTeamMember, clearTeamError } from "@/store/slices/teamSlice";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { GridItem } from "@/components/layout/GridItem";
import type { Team } from "@/types/team";

interface InviteMemberFormProps {
  onSuccess?: () => void;
  teams: Team[];
}

const InviteMemberForm: React.FC<InviteMemberFormProps> = ({
  onSuccess,
  teams = [],
}) => {
  const dispatch = useAppDispatch();
  const { processing, error } = useAppSelector((state) => ({
    processing: state.team.processing,
    error: state.team.error,
  }));

  const [formData, setFormData] = useState({
    teamId: "",
    email: "",
    role: "member" as "member" | "admin",
    message: "",
  });

  // Type-safe adapter for Select fields
  const handleSelectChange =
    (field: keyof typeof formData) => (e: { target: { value: unknown } }) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === "role"
            ? (e.target.value as "member" | "admin")
            : (e.target.value as string),
      }));
    };

  // Regular input handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId || !formData.email) return;

    const result = await dispatch(
      inviteTeamMember({
        teamId: formData.teamId,
        data: {
          email: formData.email,
          role: formData.role,
          message: formData.message,
        },
      })
    );

    if (inviteTeamMember.fulfilled.match(result)) {
      setFormData({
        teamId: "",
        email: "",
        role: "member",
        message: "",
      });
      if (onSuccess) onSuccess();
    }
  };

  const isFormValid = !!formData.teamId && !!formData.email && !processing;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Invite A New Member
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <GridItem>
          <TextField
            select
            fullWidth
            label="Select Team"
            value={formData.teamId}
            onChange={handleSelectChange("teamId")}
            required
          >
            <MenuItem value="" disabled>
              Select a team
            </MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
        </GridItem>

        <GridItem>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </GridItem>

        <GridItem sx={{ width: "50%" }}>
          <TextField
            select
            fullWidth
            label="Role"
            value={formData.role}
            onChange={handleSelectChange("role")}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </GridItem>

        <GridItem>
          <TextField
            fullWidth
            label="Personal Message (Optional)"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </GridItem>
      </Box>

      <GridItem sx={{ mt: 2, justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isFormValid}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          Send Invitation
        </Button>
      </GridItem>
    </Box>
  );
};

export default InviteMemberForm;
