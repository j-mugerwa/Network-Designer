import { Container, CssBaseline, Box, Avatar, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SignUpForm from "@/components/common/SignUpForm";
import Head from "next/head";

const SignUpPage = () => {
  return (
    <>
      <Head>
        <title>Sign Up | Network Design Platform</title>
      </Head>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <SignUpForm />
        </Box>
      </Container>
    </>
  );
};

export default SignUpPage;
