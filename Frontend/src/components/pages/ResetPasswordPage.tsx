// src/components/pages/ResetPasswordPage.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  resetPassword,
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AuthLayout from "@/components/layout/AuthLayout";
import { passwordStrength } from "check-password-strength";

const ResetPasswordPage = () => {
  const router = useRouter();
  const { token, email } = router.query;
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector(
    (state) => state.user.passwordReset
  );

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
    tokenError: "",
  });

  useEffect(() => {
    // Validate token and email on mount
    if (!token || !email) {
      setErrors((prev) => ({
        ...prev,
        tokenError: "Invalid reset link. Please request a new one.",
      }));
    }

    // Reset state when component mounts
    dispatch(resetPasswordResetState());
  }, [token, email, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePassword = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Check password strength
    const strength = passwordStrength(formData.newPassword);
    if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
      isValid = false;
    } else if (strength.id < 2) {
      // Medium strength or better
      newErrors.newPassword =
        "Password is too weak. Include numbers and special characters";
      isValid = false;
    }

    // Check password match
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;
    if (!token || !email) return;

    dispatch(
      resetPassword({
        token: token as string,
        newPassword: formData.newPassword,
        email: email as string,
      })
    );
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset Successful">
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
              Password Updated!
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Your password has been successfully reset. You can now log in with
              your new password.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/login")}
              sx={{ mt: 2 }}
            >
              Back to Login
            </Button>
          </Box>
        </Container>
      </AuthLayout>
    );
  }

  if (errors.tokenError) {
    return (
      <AuthLayout title="Invalid Reset Link">
        <Container maxWidth="sm">
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
              Invalid Reset Link
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {errors.tokenError}
            </Typography>
            <Link href="/forgot-password" variant="body2">
              Request a new reset link
            </Link>
          </Box>
        </Container>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password">
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
            Reset Password
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, textAlign: "center" }}>
            Enter your new password below
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type={formData.showPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={handleChange}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            required
            margin="normal"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        showPassword: !prev.showPassword,
                      }))
                    }
                    edge="end"
                  >
                    {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={formData.showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
            margin="normal"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        showConfirmPassword: !prev.showConfirmPassword,
                      }))
                    }
                    edge="end"
                  >
                    {formData.showConfirmPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
              "Reset Password"
            )}
          </Button>
        </Box>
      </Container>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
