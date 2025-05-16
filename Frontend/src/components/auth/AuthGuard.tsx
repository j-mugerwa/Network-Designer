// components/common/AuthGuard.tsx
import { useRouter } from "next/router";
import { useEffect, ReactNode } from "react";
import { useAppSelector } from "@/store/store";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string; // Changed from 'role' to 'requiredRole' for clarity
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { currentUser } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!loading) {
      // If not authenticated
      if (!user) {
        const redirectUrl =
          router.asPath === "/" ? "/dashboard" : router.asPath;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      // If role-based access control is specified
      if (requiredRole && currentUser?.role !== requiredRole) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, loading, router, requiredRole, currentUser]);

  if (loading || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Additional check for role if required
  if (requiredRole && currentUser?.role !== requiredRole) {
    return null; // Or redirect to unauthorized page
  }

  return <>{children}</>;
};

export default AuthGuard;
