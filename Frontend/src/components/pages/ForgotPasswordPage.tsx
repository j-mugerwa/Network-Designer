// src/components/pages/ForgotPasswordPage.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  forgotPassword,
  resetPasswordResetState,
} from "@/store/slices/userSlice";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
} from "@mui/material";
import AuthLayout from "@/components/layout/AuthLayout";

const RESEND_COOLDOWN = 30000; // 30 seconds

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [canResend, setCanResend] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector(
    (state) => state.user.passwordReset
  );

  useEffect(() => {
    dispatch(resetPasswordResetState());

    // Clean up cooldown timer
    return () => {
      if (cooldown > 0) {
        clearInterval(cooldown);
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (!canResend && cooldown === 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      setCooldown(RESEND_COOLDOWN);
      return () => clearInterval(timer);
    }
  }, [canResend]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    dispatch(forgotPassword(email));
    setSubmitted(true);
    setCanResend(false);
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canResend) return;

    dispatch(forgotPassword(email));
    setCanResend(false);
  };

  if (success) {
    return (
      <AuthLayout title="Check Your Email">
        <Container maxWidth="sm">
          <Box
            sx={{
              mt: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h4" gutterBottom>
              Check Your Email
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">Didn't receive the email?</Typography>
              {canResend ? (
                <Link
                  href="#"
                  onClick={handleResend}
                  sx={{ cursor: "pointer" }}
                >
                  Resend
                </Link>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Resend available in {Math.ceil(cooldown / 1000)}s
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password">
      <Container maxWidth="sm">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, textAlign: "center" }}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            error={!!emailError}
            helperText={emailError}
            required
            margin="normal"
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <Box sx={{ textAlign: "center", width: "100%" }}>
            <Link href="/login" variant="body2">
              Remember your password? Sign in
            </Link>
          </Box>
        </Box>
      </Container>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
