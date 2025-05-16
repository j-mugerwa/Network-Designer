import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useRouter } from "next/router";
import { logoutUser } from "@/store/slices/authSlice";
import { useAppSelector, useAppDispatch } from "@/store/store";

const Navbar: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        router.push("/");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleHomeNavigation = () => {
    router.push(isAuthenticated ? "/dashboard" : "/");
  };

  return (
    <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
      <Toolbar>
        {/* Left Section: Title - Now clickable */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={handleHomeNavigation}
        >
          Network Designer
        </Typography>

        {/* Right Section: Login/Logout & Sign Up */}
        {isAuthenticated ? (
          <>
            <Button color="inherit" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
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
