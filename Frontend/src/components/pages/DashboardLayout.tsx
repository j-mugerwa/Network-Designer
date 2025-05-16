// src/components/pages/DashboardLayout.tsx
import { Typography } from "@mui/material";
import { useAppSelector } from "@/store/store";

const DashboardComponent = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Welcome Back, {currentUser?.name || user?.displayName || "User"}!
      </Typography>
      <Typography variant="body1">
        This is your dashboard. More features coming soon!
      </Typography>
      {currentUser?.role && (
        <Typography variant="body2" color="text.secondary">
          Role: {currentUser.role}
        </Typography>
      )}
    </div>
  );
};

export default DashboardComponent;
