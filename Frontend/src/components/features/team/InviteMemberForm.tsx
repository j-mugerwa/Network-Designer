import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { inviteTeamMember, clearTeamError } from "@/store/slices/teamSlice";
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
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

  // Nuclear option - completely bypassing type checking for the select
  const handleTeamChange = (event: any) => {
    const selectedValue = event?.target?.value ?? "";
    console.log("Selected team ID:", selectedValue);
    setFormData((prev) => {
      const newState = { ...prev, teamId: selectedValue };
      console.log("New form state:", newState);
      return newState;
    });
  };

  // Handler for role selection
  const handleRoleChange = (event: any) => {
    setFormData((prev) => ({
      ...prev,
      role: (event?.target?.value as "member" | "admin") || "member",
    }));
  };

  // Handler for regular text inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data on submit:", formData);
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
          <FormControl fullWidth>
            <InputLabel id="team-select-label">Select Team *</InputLabel>
            <Select
              labelId="team-select-label"
              id="team-select"
              value={formData.teamId}
              label="Select Team *"
              onChange={handleTeamChange}
              inputProps={{ "data-testid": "team-select" }}
              required
            >
              <MenuItem value="">
                <em>Select a team</em>
              </MenuItem>
              {teams.map((team) => {
                const teamId = team._id || team.id;
                console.log(`Rendering team ${team.name} with ID:`, teamId);
                return (
                  <MenuItem
                    key={teamId}
                    value={teamId}
                    data-testid={`team-option-${teamId}`}
                  >
                    {team.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
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
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={formData.role}
              label="Role"
              onChange={handleRoleChange}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
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
