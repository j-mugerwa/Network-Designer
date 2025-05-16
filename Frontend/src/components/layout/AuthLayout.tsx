// src/components/layout/AuthLayout.tsx
import { Box, Container } from "@mui/material";
import Head from "next/head";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <>
      <Head>
        <title>{title} | Your App Name</title>
        <meta name="description" content={`${title} page`} />
      </Head>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            justifyContent: "center",
            py: 4,
          }}
        >
          {children}
        </Box>
      </Container>
    </>
  );
};

export default AuthLayout;
