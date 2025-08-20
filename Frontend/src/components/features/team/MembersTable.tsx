// src/components/features/teams/MembersTable.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchTeamDetails,
  removeTeamMember,
  selectCurrentTeam,
  selectTeamLoading,
  selectTeamError,
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
  Chip,
  Avatar,
} from "@mui/material";
import { MoreVert, Delete, Person } from "@mui/icons-material";
import { useRouter } from "next/router";

interface MembersTableProps {
  teamId: string;
}

// Helper function to get user data from member
const getUserFromMember = (member: any) => {
  if (typeof member.userId === "object" && member.userId !== null) {
    // userId is a populated user object
    return member.userId;
  } else {
    // userId is a string, return minimal user info
    return {
      id: member.userId,
      name: "Unknown User",
      email: member.userId,
      avatar: undefined,
    };
  }
};

const MembersTable: React.FC<MembersTableProps> = ({ teamId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentTeam = useAppSelector(selectCurrentTeam);
  const loading = useAppSelector(selectTeamLoading);
  const error = useAppSelector(selectTeamError);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamDetails = async () => {
      try {
        await dispatch(fetchTeamDetails(teamId));
      } catch (err) {
        console.error("Failed to load team details:", err);
      }
    };
    loadTeamDetails();
  }, [dispatch, teamId]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    memberId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(memberId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleRemoveMember = async () => {
    if (selectedMember && currentTeam) {
      try {
        await dispatch(
          removeTeamMember({
            teamId: currentTeam.id,
            memberId: selectedMember,
          })
        );
        // Refresh team details
        await dispatch(fetchTeamDetails(teamId));
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    }
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

  if (!currentTeam || currentTeam.members.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body1">No members found in this team.</Typography>
      </Box>
    );
  }

  const currentUserIsOwner = currentTeam.createdBy === router.query.uid;
  const currentUserIsAdmin = currentTeam.members.some((m) => {
    const memberUserId = typeof m.userId === "string" ? m.userId : m.userId.id;
    return (
      memberUserId === router.query.uid && ["owner", "admin"].includes(m.role)
    );
  });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Member</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Joined</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentTeam.members.map((member) => {
            const memberUser = getUserFromMember(member);
            const memberUserId =
              typeof member.userId === "string"
                ? member.userId
                : member.userId.id;
            const isCurrentUser = memberUserId === router.query.uid;
            const canRemove =
              currentUserIsAdmin && !isCurrentUser && member.role !== "owner";

            return (
              <TableRow key={memberUserId} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {memberUser.avatar ? (
                        <img src={memberUser.avatar} alt={memberUser.name} />
                      ) : (
                        <Person />
                      )}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="medium">
                        {memberUser.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {memberUser.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={member.role}
                    color={getRoleColor(member.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {canRemove && (
                    <IconButton
                      aria-label="member actions"
                      onClick={(e) => handleMenuOpen(e, memberUserId || "")}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
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
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleRemoveMember} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Remove Member
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default MembersTable;
