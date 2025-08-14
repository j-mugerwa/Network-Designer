import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/store";
import { acceptTeamInvitation } from "@/store/slices/teamSlice";
import {
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";

const AcceptInvitePage = () => {
  const router = useRouter();
  const { token: tokenQuery } = router.query;
  const token = Array.isArray(tokenQuery) ? tokenQuery[0] : tokenQuery;
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (typeof token !== "string") {
        throw new Error("Invalid invitation token");
      }

      const result = await dispatch(acceptTeamInvitation({ token, password }));

      if (acceptTeamInvitation.fulfilled.match(result)) {
        setTimeout(() => router.push(`/team`), 100);
        //router.push(`/team`);
      } else if (result.payload) {
        setError(result.payload.message);
        if (result.payload.requiresRegistration) {
          setNeedsRegistration(true);
          // Get email and company from the error payload if available
          setEmail(result.payload.email || "");
          setCompany(result.payload.company || "");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {needsRegistration ? "Create Your Account" : "Accept Team Invitation"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {needsRegistration ? (
        <>
          <TextField
            label="Email"
            value={email}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="Company"
            value={company}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button
            variant="contained"
            onClick={handleAccept}
            disabled={loading || !password}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              "Create Account & Join Team"
            )}
          </Button>
        </>
      ) : (
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={loading}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Accept Invitation"}
        </Button>
      )}

      {!needsRegistration && (
        <Button
          variant="outlined"
          color="error"
          onClick={() => router.push(`/team/decline-invite?token=${token}`)}
          disabled={loading}
          fullWidth
          sx={{ mt: 2 }}
        >
          Decline Invitation
        </Button>
      )}
    </Box>
  );
};

export default AcceptInvitePage;
