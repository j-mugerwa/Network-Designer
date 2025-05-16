// src/pages/Login.tsx
import { Container, Paper, Typography } from "@mui/material";
import LoginForm from "@/components/common/LoginForm";

const Login = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        <LoginForm />
      </Paper>
    </Container>
  );
};

export default Login;
