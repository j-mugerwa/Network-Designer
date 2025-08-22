// src/components/features/teams/AssignDesignToTeam.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { assignDesignToTeam } from "@/store/slices/networkDesignSlice";
import { fetchUserTeams, selectTeams } from "@/store/slices/teamSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

interface AssignDesignToTeamProps {
  designId: string;
  designName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignDesignToTeam: React.FC<AssignDesignToTeamProps> = ({
  designId,
  designName,
  open,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const teams = useAppSelector(selectTeams);
  const { loading, error } = useAppSelector((state) => state.designs);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchUserTeams());
    }
  }, [open, dispatch]);

  const handleAssign = async () => {
    if (!selectedTeam) return;

    setAssigning(true);
    try {
      await dispatch(assignDesignToTeam({ designId, teamId: selectedTeam }));
      setAssigning(false);
      setSelectedTeam("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedTeam("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Design to Team</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Assign "{designName}" to a team:
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Team</InputLabel>
            <Select
              value={selectedTeam}
              label="Select Team"
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={assigning}
            >
              <MenuItem value="">
                <em>None (Personal Design)</em>
              </MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={assigning}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!selectedTeam || assigning}
          startIcon={assigning ? <CircularProgress size={20} /> : null}
        >
          {assigning ? "Assigning..." : "Assign to Team"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDesignToTeam;
