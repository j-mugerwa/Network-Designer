import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/slices/authSlice";
import { AppDispatch } from "@/store/store";
import {
  Button,
  TextField,
  Box,
  Typography,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Alert,
} from "@mui/material";

const passwordStrength = (password: string) => {
  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Complexity checks
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 5); // Max strength of 5
};

const strengthLabels = ["Very Weak", "Weak", "Good", "Strong", "Very Strong"];
const strengthColors = ["error", "warning", "info", "success", "success"];

const SignUpForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "user",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);

  useEffect(() => {
    setPasswordScore(passwordStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.company.trim()) newErrors.company = "Company is required";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (passwordScore < 2) {
      newErrors.password = "Password is too weak";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role,
          password: formData.password,
          terms: formData.termsAccepted,
        })
      ).unwrap();

      router.push("/auth/verify-email");
    } catch (error: any) {
      setErrors({
        ...errors,
        form: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {errors.form && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.form}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        <TextField
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          required
        />

        <TextField
          fullWidth
          label="Company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          error={!!errors.company}
          helperText={errors.company}
          required
        />

        <FormControl fullWidth>
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            name="role"
            value={formData.role}
            label="Role"
            onChange={handleSelectChange}
          >
            <MenuItem value="user">Standard User (Basic access)</MenuItem>
            <MenuItem value="network-admin">
              Network Administrator (Full network management)
            </MenuItem>
            <MenuItem value="admin">
              System Administrator (Full system access)
            </MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Box sx={{ display: "flex", gap: 2, mb: formData.password ? 1 : 0 }}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              required
            />
          </Box>
          {formData.password && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(passwordScore / 4) * 100}
                color={strengthColors[passwordScore - 1] as any}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary">
                Strength: {strengthLabels[passwordScore - 1]}
              </Typography>
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noopener">
                Terms and Conditions
              </Link>
            </Typography>
          }
        />
        {errors.termsAccepted && (
          <Typography color="error" variant="caption">
            {errors.termsAccepted}
          </Typography>
        )}
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? "Signing Up..." : "Sign Up"}
      </Button>

      <Box sx={{ textAlign: "center" }}>
        <Link href="/login" variant="body2">
          Already have an account? Sign in
        </Link>
      </Box>
    </Box>
  );
};

export default SignUpForm;
