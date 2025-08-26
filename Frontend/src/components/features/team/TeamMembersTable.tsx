// src/components/features/team/TeamMembersTable.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchMembersFromOwnedTeams,
  selectTeamMembers,
  selectTeamMembersLoading,
  selectTeamMembersError,
  clearTeamMembersError,
} from "@/store/slices/teamMembersSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Skeleton,
  Alert,
  Chip,
  Avatar,
  IconButton,
} from "@mui/material";
import { Person, Visibility } from "@mui/icons-material";
import { useRouter } from "next/router";

const TeamMembersTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const members = useAppSelector(selectTeamMembers);
  const loading = useAppSelector(selectTeamMembersLoading);
  const error = useAppSelector(selectTeamMembersError);

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadTeamMembers = async () => {
      setLocalLoading(true);
      try {
        await dispatch(fetchMembersFromOwnedTeams());
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    loadTeamMembers();
  }, [dispatch]);

  const handleViewTeam = (teamId: string) => {
    router.push(`/team/${teamId}/members`);
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

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Alert
          severity="error"
          onClose={() => dispatch(clearTeamMembersError())}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (loading || localLoading) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (members.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body1">
          No members found in your teams. Create a team and add members to get
          started.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Member</TableCell>
            <TableCell>Teams & Roles</TableCell>
            <TableCell>Joined</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.userId} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt={member.user.name} />
                    ) : (
                      <Person />
                    )}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="medium">
                      {member.user.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {member.user.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" flexDirection="column" gap={1}>
                  {member.teams.map((team) => (
                    <Box
                      key={team.teamId}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Chip
                        label={team.role}
                        color={getRoleColor(team.role)}
                        size="small"
                      />
                      <Typography variant="body2">{team.teamName}</Typography>
                    </Box>
                  ))}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="textSecondary">
                  {new Date(member.teams[0].joinedAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleViewTeam(member.teams[0].teamId)}
                  title="View Team"
                >
                  <Visibility />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TeamMembersTable;
