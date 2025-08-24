// src/components/features/teams/TeamDesignsTable.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Delete, Visibility } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchUserTeams } from "@/store/slices/teamSlice";
import { removeDesignFromTeam } from "@/store/slices/networkDesignSlice";
import { useRouter } from "next/router";
import axios from "@/lib/api/client";

interface TeamDesign {
  teamId: string;
  teamName: string;
  designId: string;
  designName: string;
  designStatus: string;
  createdAt: string;
}

export const TeamDesignsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
  } = useAppSelector((state) => state.team);
  const { loading: designLoading, error: designError } = useAppSelector(
    (state) => state.designs
  );

  const [teamDesigns, setTeamDesigns] = useState<TeamDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<TeamDesign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUserTeams());
  }, [dispatch]);

  useEffect(() => {
    console.log("Teams from Redux:", teams);
    if (teams.length > 0 && teams[0].designs && teams[0].designs.length > 0) {
      console.log("First design object:", teams[0].designs[0]);
      console.log("Available design fields:", Object.keys(teams[0].designs[0]));
    }
  }, [teams]);

  useEffect(() => {
    if (teams.length > 0) {
      // Extract team designs from all teams where user is owner
      const designs: TeamDesign[] = [];

      teams.forEach((team) => {
        if (team.designs && team.designs.length > 0) {
          team.designs.forEach((design) => {
            designs.push({
              teamId: team._id || "unknown-team",
              teamName: team.name,
              designId: design._id || design.toString(),
              designName: design.designName || "Unknown Design",
              designStatus: design.designStatus || "unknown",
              createdAt: design.createdAt || new Date().toISOString(),
            });
          });
        }
      });

      setTeamDesigns(designs);
    }
  }, [teams]);

  // In TeamDesignsTable.tsx, replace the useEffect with:
  /*
  useEffect(() => {
    const loadTeamDesigns = async () => {
      const designs: TeamDesign[] = [];

      for (const team of teams) {
        if (team._id) {
          try {
            // Fetch designs for each team
            const response = await axios.get(`/team/${team._id}/designs`);
            const teamDesigns = response.data.data.designs;

            teamDesigns.forEach((design: any) => {
              designs.push({
                teamId: team._id || "unknown-team",
                teamName: team.name,
                designId: design._id || design.id,
                designName: design.designName || "Unknown Design",
                designStatus: design.designStatus || "unknown",
                createdAt: design.createdAt || new Date().toISOString(),
              });
            });
          } catch (error) {
            console.error(
              `Failed to fetch designs for team ${team._id}:`,
              error
            );
          }
        }
      }

      setTeamDesigns(designs);
    };

    if (teams.length > 0) {
      loadTeamDesigns();
    }
  }, [teams]);
  */

  const handleRemoveDesign = (design: TeamDesign) => {
    setSelectedDesign(design);
    setDialogOpen(true);
  };

  const confirmRemoveDesign = async () => {
    if (!selectedDesign) return;

    try {
      await dispatch(removeDesignFromTeam(selectedDesign.designId)).unwrap();
      setDialogOpen(false);
      setSelectedDesign(null);
      // Refresh the data
      dispatch(fetchUserTeams());
    } catch (error) {
      console.error("Failed to remove design from team:", error);
    }
  };

  const handleViewDesign = (designId: string) => {
    router.push(`/designs/${designId}`);
  };

  if (teamsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (teamsError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {teamsError}
      </Alert>
    );
  }

  if (teamDesigns.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No designs found in your teams. Designs will appear here when they are
          assigned to teams you own.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Design Name</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamDesigns.map((design) => (
              <TableRow key={`${design.teamId}-${design.designId}`}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {design.designName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{design.teamName}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={design.designStatus}
                    color={
                      design.designStatus === "active"
                        ? "success"
                        : design.designStatus === "draft"
                        ? "default"
                        : "secondary"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDesign(design.designId)}
                    title="View Design"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveDesign(design)}
                    title="Remove from Team"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Remove Design from Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{selectedDesign?.designName}" from
            "{selectedDesign?.teamName}"? This design will become a personal
            design and will no longer be accessible to team members.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmRemoveDesign}
            color="error"
            variant="contained"
            disabled={designLoading}
          >
            {designLoading ? <CircularProgress size={24} /> : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      {designError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {designError}
        </Alert>
      )}
    </>
  );
};
