// src/components/common/LoginForm.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAppDispatch } from "@/store/store";
import { loginUser } from "@/store/slices/authSlice";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
} from "@mui/material";

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await dispatch(loginUser(formData)).unwrap();
      router.push("/dashboard"); // Next.js navigation
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email or Username"
        name="email"
        type="text"
        value={formData.email}
        onChange={handleChange}
        required
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        sx={{ mb: 1 }}
      />

      <Typography variant="body2" sx={{ mb: 2, textAlign: "right" }}>
        <Link href="/forgot-password" passHref>
          <Typography component="a" sx={{ textDecoration: "none" }}>
            Forgot password?
          </Typography>
        </Link>
      </Typography>

      <Button
        fullWidth
        type="submit"
        variant="contained"
        size="large"
        sx={{ mb: 2 }}
      >
        Login
      </Button>

      <Stack direction="row" spacing={1} justifyContent="center">
        <Typography variant="body2">Don't have an account?</Typography>
        <Link href="/signup" passHref>
          <Typography
            variant="body2"
            color="primary"
            component="a"
            sx={{ textDecoration: "none" }}
          >
            Sign up
          </Typography>
        </Link>
      </Stack>
    </Box>
  );
};

export default LoginForm;
