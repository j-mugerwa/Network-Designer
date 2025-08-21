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
    return {
      id: member.userId.id || member.userId._id,
      name: member.userId.name || member.userId.email || "Unknown User",
      email: member.userId.email || member.userId.id || "No email",
      avatar: member.userId.avatar,
    };
  } else {
    // userId is a string, return minimal user info
    return {
      id: member.userId,
      name: "Unknown User",
      email: member.userId, // Use the userId as email
      avatar: undefined,
    };
  }
};

// Helper function to extract member user ID
const getMemberUserId = (member: any): string => {
  if (typeof member.userId === "string") {
    return member.userId;
  } else if (member.userId && typeof member.userId === "object") {
    return member.userId.id || member.userId._id || "";
  }
  return "";
};

const MembersTable: React.FC<MembersTableProps> = ({ teamId }) => {
  console.log("MembersTable received teamId:", teamId);

  if (!teamId || teamId === "undefined") {
    return (
      <Box p={4} textAlign="center">
        <Alert severity="error">Invalid team ID received: {teamId}</Alert>
      </Box>
    );
  }

  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentTeam = useAppSelector(selectCurrentTeam);
  const loading = useAppSelector(selectTeamLoading);
  const error = useAppSelector(selectTeamError);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadTeamDetails = async () => {
      if (!teamId || teamId === "undefined") {
        console.error("Invalid teamId:", teamId);
        return;
      }

      setLocalLoading(true);
      try {
        await dispatch(fetchTeamDetails(teamId));
      } catch (err) {
        console.error("Failed to load team details:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    loadTeamDetails();
  }, [dispatch, teamId]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    memberId: string
  ) => {
    if (!memberId) return;
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

  // Show error if teamId is invalid
  if (!teamId || teamId === "undefined") {
    return (
      <Box p={4} textAlign="center">
        <Alert severity="error">
          Invalid team ID. Please go back and try again.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Alert severity="error" onClose={() => dispatch(clearTeamError())}>
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

  if (!currentTeam) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body1">Team not found.</Typography>
      </Box>
    );
  }

  if (currentTeam.members.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body1">No members found in this team.</Typography>
      </Box>
    );
  }

  // Get current user ID from router query
  const currentUserId = router.query.uid as string;

  // Debug logging
  console.log("=== DEBUG MEMBERS TABLE ===");
  console.log("Current user ID:", currentUserId);
  console.log("Team createdBy:", currentTeam.createdBy);
  console.log(
    "Current user is team owner:",
    currentTeam.createdBy === currentUserId
  );
  console.log(
    "Team members:",
    currentTeam.members.map((m) => ({
      userId: getMemberUserId(m),
      role: m.role,
      isCurrentUser: getMemberUserId(m) === currentUserId,
    }))
  );

  // Only team owners can remove members
  const currentUserIsOwner = currentTeam.createdBy === currentUserId;

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
            const memberUserId = getMemberUserId(member);

            // Check if this member is the current user
            const isCurrentUser = memberUserId === currentUserId;

            // Only team owners can remove members (except themselves and other owners)
            const canRemove =
              currentUserIsOwner && !isCurrentUser && member.role !== "owner";

            // Debug logging for each member
            console.log(`Member ${memberUser.name}:`, {
              memberUserId,
              isCurrentUser,
              role: member.role,
              canRemove,
              currentUserIsOwner,
            });

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
                      onClick={(e) => handleMenuOpen(e, memberUserId)}
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
