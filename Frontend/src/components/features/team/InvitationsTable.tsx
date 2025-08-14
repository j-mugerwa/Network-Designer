import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchSentInvitations,
  deleteInvitation,
  resendInvitation,
  selectSentInvitations,
  selectInvitationsLoading,
} from "@/store/slices/teamSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Send as SendIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

const InvitationsTable = () => {
  const dispatch = useAppDispatch();
  const invitations = useAppSelector(selectSentInvitations);
  const loading = useAppSelector(selectInvitationsLoading);

  useEffect(() => {
    dispatch(fetchSentInvitations());
  }, [dispatch]);

  const handleDelete = (invitationId: string) => {
    if (window.confirm("Are you sure you want to delete this invitation?")) {
      dispatch(deleteInvitation(invitationId));
    }
  };

  const handleResend = (invitationId: string) => {
    if (window.confirm("Resend this invitation?")) {
      dispatch(resendInvitation(invitationId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "success";
      case "expired":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Sent Invitations
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : invitations.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No invitations sent yet
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="invitations table">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Sent On</TableCell>
                <TableCell>Expires At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{invitation.team.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={invitation.role}
                      size="small"
                      color={
                        invitation.role === "admin" ? "primary" : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.createdAt), "PPpp")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.expiresAt), "PPpp")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invitation.status}
                      color={getStatusColor(invitation.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Resend invitation">
                      <IconButton
                        onClick={() => handleResend(invitation.id)}
                        disabled={invitation.status !== "pending"}
                      >
                        <SendIcon
                          color={
                            invitation.status === "pending"
                              ? "primary"
                              : "disabled"
                          }
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete invitation">
                      <IconButton onClick={() => handleDelete(invitation.id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default InvitationsTable;
