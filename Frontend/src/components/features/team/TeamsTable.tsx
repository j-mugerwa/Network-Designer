// src/components/features/teams/TeamsTable.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchUserTeams,
  selectTeams,
  selectTeamLoading,
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
  Chip,
} from "@mui/material";
import { MoreVert, Edit, People, Delete } from "@mui/icons-material";
import { useRouter } from "next/router";

const TeamsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const teams = useAppSelector(selectTeams);
  const loading = useAppSelector(selectTeamLoading);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  React.useEffect(() => {
    dispatch(fetchUserTeams());
  }, [dispatch]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    teamId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(teamId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleEdit = () => {
    if (selectedTeam) {
      router.push(`/teams/${selectedTeam}/edit`);
    }
    handleMenuClose();
  };

  const handleManageMembers = () => {
    if (selectedTeam) {
      router.push(`/teams/${selectedTeam}/members`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    handleMenuClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "primary";
      case "admin":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
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
          {teams.map((team) => {
            return (
              <TableRow key={team.id}>
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
                    onClick={() => router.push(`/team/${team.id}/members`)}
                  >
                    {team.members.length} members
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="actions"
                    onClick={(e) => handleMenuOpen(e, team.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleManageMembers}>
          <People fontSize="small" sx={{ mr: 1 }} /> Manage Members
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default TeamsTable;
