// src/components/layouts/AppLayout.tsx
import { Box, Container, CssBaseline } from "@mui/material";
import Head from "next/head";
import { ReactNode } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export const AppLayout = ({ children, title }: AppLayoutProps) => {
  return (
    <>
      <Head>
        <title>
          {title
            ? `${title} | Network Design Platform`
            : "Network Design Platform"}
        </title>
        <meta
          name="description"
          content="Professional network design and visualization platform"
        />
      </Head>
      <CssBaseline />

      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <DashboardSidebar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Container maxWidth="xl" sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>
      </Box>
    </>
  );
};

// Sidebar width constant
const drawerWidth = 240;
