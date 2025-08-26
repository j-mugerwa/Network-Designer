// src/components/features/teams/TeamsTable.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchUserTeams,
  deleteTeam,
  selectTeams,
  selectTeamLoading,
  selectTeamError,
  selectTeamProcessing,
  clearTeamError,
} from "@/store/slices/teamSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { MoreVert, Edit, People, Delete } from "@mui/icons-material";
import { useRouter } from "next/router";

const TeamsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const teams = useAppSelector(selectTeams);
  const loading = useAppSelector(selectTeamLoading);
  const processing = useAppSelector(selectTeamProcessing);
  const error = useAppSelector(selectTeamError);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        await dispatch(fetchUserTeams());
      } catch (err) {
        console.error("Failed to load teams:", err);
      }
    };
    loadTeams();
  }, [dispatch]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    teamId: string,
    teamName: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(teamId);
    setTeamToDelete({ id: teamId, name: teamName });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleEdit = () => {
    if (selectedTeam) {
      router.push(`/team/${selectedTeam}/edit`);
    }
    handleMenuClose();
  };

  const handleManageMembers = () => {
    if (selectedTeam) {
      router.push(`/team/${selectedTeam}/members`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (teamToDelete) {
      try {
        await dispatch(deleteTeam(teamToDelete.id));
        setDeleteDialogOpen(false);
        setTeamToDelete(null);
        // Refresh the teams list
        await dispatch(fetchUserTeams());
      } catch (err) {
        console.error("Failed to delete team:", err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  };

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Alert severity="error" onClose={() => dispatch(clearTeamError())}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (teams.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body1">You don't have any teams yet.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team._id || team.id} hover>
                <TableCell>
                  <Typography fontWeight="medium">{team.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {team.description || "No description"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<People />}
                    size="small"
                    onClick={() => {
                      router.push(`/team/${team._id}/members`);
                    }}
                  >
                    {team.members.length} members
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="team actions"
                    onClick={(e) =>
                      handleMenuOpen(e, team._id || team.id || "", team.name)
                    }
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleManageMembers}>
            <People fontSize="small" sx={{ mr: 1 }} /> Manage Members
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-team-dialog-title"
      >
        <DialogTitle id="delete-team-dialog-title">Delete Team</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the team "{teamToDelete?.name}"?
            This action cannot be undone and all team data will be permanently
            removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeamsTable;
