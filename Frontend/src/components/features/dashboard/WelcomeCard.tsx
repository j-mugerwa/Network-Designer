// src/components/features/dashboard/WelcomeCard.tsx
import { Card, CardContent, Typography, Avatar, Box } from "@mui/material";
import { useAppSelector } from "@/store/store";

const WelcomeCard = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography variant="h5" component="div">
              Welcome Back, {currentUser?.name || user?.displayName || "User"}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Hope we can serve {currentUser?.company || "your company"} better
              today
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
