// src/components/auth/SignUpForm.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { registerUser } from "@/store/slices/authSlice";
import {
  fetchSubscriptionPlans,
  initializePayment,
  clearPaymentState,
} from "@/store/slices/subscriptionSlice";
import { SelectChangeEvent } from "@mui/material/Select";
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
  RadioGroup,
  Radio,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import { GridItem } from "../layout/GridItem";

const passwordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return Math.min(strength, 5);
};

const strengthLabels = ["Very Weak", "Weak", "Good", "Strong", "Very Strong"];
const strengthColors = ["error", "warning", "info", "success", "success"];

const SignUpForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    plans,
    loading: plansLoading,
    paymentError,
    paymentLoading,
  } = useAppSelector((state) => state.subscriptions);
  const { loading: authLoading, error: authError } = useAppSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "user",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    planId: "",
    paymentMethod: "card",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordScore, setPasswordScore] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch plans on mount
  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  // Set default plan once plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !formData.planId) {
      const trialPlan = plans.find((p) =>
        p.name.toLowerCase().includes("trial")
      );
      const defaultPlan = trialPlan || plans[0];
      setFormData((prev) => ({
        ...prev,
        planId: defaultPlan._id,
      }));
      setShowPaymentForm(!defaultPlan.name.toLowerCase().includes("trial"));
    }
  }, [plans, formData.planId]);

  useEffect(() => {
    setPasswordScore(passwordStrength(formData.password));
  }, [formData.password]);

  useEffect(() => {
    if (paymentError) {
      // Display payment error to user
      console.error("Payment Error:", paymentError);
      // You might want to show this in your UI
    }
  }, [paymentError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Show payment form if not selecting trial
    if (name === "planId") {
      const selectedPlan = plans.find((p) => p._id === newValue);
      setShowPaymentForm(!selectedPlan?.name.toLowerCase().includes("trial"));
    }
  };

  //Handle change of the role selection
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  //For toggling the features display.
  const toggleFeatures = (planId: string) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
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
    if (!formData.planId) {
      newErrors.planId = "Please select a plan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // First register the user
      const result = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role,
          password: formData.password,
          terms: formData.termsAccepted,
          planId: formData.planId,
        })
      ).unwrap();

      // Check if we need to process payment
      const selectedPlan = plans.find((p) => p._id === formData.planId);
      const isTrial = selectedPlan?.price === 0;

      if (isTrial) {
        router.push("/auth/verify-email");
      } else {
        // Clear any previous payment state before initializing new payment
        dispatch(clearPaymentState());

        // Initialize payment
        const paymentResult = await dispatch(
          initializePayment({
            email: formData.email,
            planId: formData.planId,
          })
        ).unwrap();

        // Redirect to payment URL
        window.location.href = paymentResult.authorization_url;
      }
    } catch (error) {
      console.error("Registration error:", error);
      // You might want to show this error in your UI
    }
  };

  if (plansLoading && !plans.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Personal Info Fields */}
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
            <MenuItem value="user">Standard User</MenuItem>
            <MenuItem value="network-admin">Network Administrator</MenuItem>
            <MenuItem value="admin">System Administrator</MenuItem>
          </Select>
        </FormControl>

        {/* Password Fields */}
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

        {/* Subscription Plan Selection */}
        <Typography variant="h6" sx={{ mt: 2 }}>
          Choose Your Plan
        </Typography>

        {errors.planId && (
          <Typography color="error" variant="caption">
            {errors.planId}
          </Typography>
        )}

        <RadioGroup
          name="planId"
          value={formData.planId}
          onChange={handleChange}
          sx={{ mb: 2 }}
        >
          <Grid container spacing={2}>
            {plans.map((plan) => (
              <GridItem
                key={plan._id}
                sx={{ width: { xs: "100%", sm: "50%" } }}
              >
                <Paper
                  elevation={formData.planId === plan._id ? 3 : 1}
                  sx={{
                    p: 2,
                    border:
                      formData.planId === plan._id
                        ? "2px solid #1976d2"
                        : "1px solid #e0e0e0",
                    borderRadius: 1,
                    cursor: "pointer",
                    height: "100%",
                  }}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      planId: plan._id,
                    }))
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Radio
                      value={plan._id}
                      checked={formData.planId === plan._id}
                      onChange={() => {}}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {plan.name}
                      </Typography>
                      <Typography variant="body2">
                        {plan.price > 0
                          ? `₦${plan.price}/${plan.interval || "month"}`
                          : "Free for 30 days"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatures(plan._id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      {expandedPlans[plan._id]
                        ? "Hide Features"
                        : "Show Features"}
                    </Button>
                  </Box>

                  {expandedPlans[plan._id] && (
                    <Box sx={{ mt: 1, pl: 4 }}>
                      <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {Object.entries(plan.features || {}).map(
                          ([key, value]) => (
                            <li key={key}>
                              <Typography variant="body2">
                                <strong>
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </strong>
                                :{" "}
                                {typeof value === "boolean"
                                  ? value
                                    ? "✓"
                                    : "✗"
                                  : Array.isArray(value)
                                  ? value.join(", ")
                                  : value}
                              </Typography>
                            </li>
                          )
                        )}
                      </ul>
                    </Box>
                  )}
                </Paper>
              </GridItem>
            ))}
          </Grid>
        </RadioGroup>

        {/* Payment Method (shown when not trial) */}
        {showPaymentForm && (
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Method
            </Typography>
            <RadioGroup
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              row
            >
              <FormControlLabel
                value="card"
                control={<Radio />}
                label="Credit/Debit Card"
              />
              <FormControlLabel
                value="bank"
                control={<Radio />}
                label="Bank Transfer"
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* Terms Acceptance */}
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
        disabled={authLoading || paymentLoading || !formData.planId} // Add paymentLoading here
      >
        {authLoading || paymentLoading ? ( // Show spinner for either loading state
          <CircularProgress size={24} color="inherit" />
        ) : formData.planId &&
          plans.find((p) => p._id === formData.planId)?.price === 0 ? (
          "Start Free Trial"
        ) : (
          "Subscribe & Continue to Payment"
        )}
      </Button>

      {/*
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={authLoading || !formData.planId}
      >
        {authLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : formData.planId &&
          plans.find((p) => p._id === formData.planId)?.price === 0 ? (
          "Start Free Trial"
        ) : (
          "Subscribe & Continue to Payment"
        )}
      </Button>
      */}

      <Box sx={{ textAlign: "center" }}>
        <Link href="/login" variant="body2">
          Already have an account? Sign in
        </Link>
      </Box>
    </Box>
  );
};

export default SignUpForm;
