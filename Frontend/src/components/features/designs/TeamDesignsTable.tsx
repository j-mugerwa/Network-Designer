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
import { fetchUserTeamsWithDesigns } from "@/store/slices/teamSlice";
import { removeDesignFromTeam } from "@/store/slices/networkDesignSlice";
import { useRouter } from "next/router";
import { selectAuthUser } from "@/store/slices/authSlice"; // Import the correct selector

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
  const authUser = useAppSelector(selectAuthUser); // Get auth user, not user slice user
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
    dispatch(fetchUserTeamsWithDesigns());
  }, [dispatch]);

  useEffect(() => {
    console.log("Teams from Redux:", teams);
    console.log("Auth user:", authUser);

    if (teams.length > 0 && teams[0].designs && teams[0].designs.length > 0) {
      console.log("First design object:", teams[0].designs[0]);
    }
  }, [teams, authUser]);

  useEffect(() => {
    if (teams.length > 0) {
      // Get the current user's UID from auth user
      const userUid = authUser?.uid;

      console.log("User UID for owner check:", userUid);
      console.log("First team createdBy:", teams[0]?.createdBy);

      // Extract team designs from all teams where user is owner
      const designs: TeamDesign[] = [];

      teams.forEach((team) => {
        // Check if user is the owner of this team
        // The team.createdBy should match the authUser.uid
        const isOwner = userUid && team.createdBy === userUid;

        console.log(
          `Team ${team.name} - isOwner: ${isOwner}, createdBy: ${team.createdBy}, userUid: ${userUid}`
        );

        if (isOwner && team.designs && team.designs.length > 0) {
          console.log(`Team ${team.name} has ${team.designs.length} designs`);

          team.designs.forEach((design) => {
            designs.push({
              teamId: team._id || team.id || "unknown-team",
              teamName: team.name,
              designId: design._id || design.id || "unknown-design",
              designName: design.designName || "Unknown Design",
              designStatus: design.designStatus || "unknown",
              createdAt: design.createdAt || new Date().toISOString(),
            });
          });
        }
      });

      console.log("Extracted designs:", designs);
      setTeamDesigns(designs);
    }
  }, [teams, authUser]);

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
      dispatch(fetchUserTeamsWithDesigns());
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

      {/* Debug info */}
      <Box mt={2} p={2} border="1px dashed #ccc">
        <Typography variant="h6">Debug Info:</Typography>
        <Typography variant="body2">Teams count: {teams.length}</Typography>
        <Typography variant="body2">
          Auth user: {JSON.stringify(authUser)}
        </Typography>
        <Typography variant="body2">
          User UID: {authUser?.uid || "None"}
        </Typography>
        <Typography variant="body2">
          First team createdBy: {teams[0]?.createdBy}
        </Typography>
        <Typography variant="body2">
          UID matches createdBy:{" "}
          {authUser?.uid === teams[0]?.createdBy ? "Yes" : "No"}
        </Typography>
      </Box>
    </>
  );
};
