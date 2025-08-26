import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/store";
import { declineTeamInvitation } from "@/store/slices/teamSlice";
import {
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";

const DeclineInvitePage = () => {
  const router = useRouter();
  const { token: tokenQuery } = router.query;
  const token = Array.isArray(tokenQuery) ? tokenQuery[0] : tokenQuery;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDecline = async () => {
    setLoading(true);
    try {
      if (typeof token !== "string") {
        throw new Error("Invalid invitation token");
      }

      const result = await dispatch(declineTeamInvitation({ token }));

      if (declineTeamInvitation.fulfilled.match(result)) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2000); // Redirect after 2 seconds
      } else if (result.payload) {
        setError(result.payload.message);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decline invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Decline Team Invitation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Invitation successfully declined. Redirecting...
        </Alert>
      ) : (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Are you sure you want to decline this team invitation?
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleDecline}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Decline Invitation"}
          </Button>
        </>
      )}
    </Box>
  );
};

export default DeclineInvitePage;
