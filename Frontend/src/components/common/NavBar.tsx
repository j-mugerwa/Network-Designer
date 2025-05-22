// src/components/layouts/Navbar.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/router";
import { useAppSelector, useAppDispatch } from "@/store/store";
import ProfileDropdown from "@/components/features/dashboard/ProfileDropdown";

const Navbar: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleHomeNavigation = () => {
    router.push(isAuthenticated ? "/dashboard" : "/");
  };

  return (
    <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={handleHomeNavigation}
        >
          Network Designer
        </Typography>

        {isAuthenticated ? (
          <Box display="flex" alignItems="center">
            <Button color="inherit" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <ProfileDropdown />
          </Box>
        ) : (
          <>
            <Button color="inherit" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button color="inherit" onClick={() => router.push("/signup")}>
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
