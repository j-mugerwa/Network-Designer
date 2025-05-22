// src/components/pages/DashboardPage.tsx
import { Box, CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";
import WelcomeCard from "@/components/features/dashboard/WelcomeCard";
import StatsCards from "@/components/features/dashboard/StatsCard";
import ActivityChart from "@/components/features/dashboard/ActivityChart";
import RecentItems from "@/components/features/dashboard/RecentItems";

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    // Fetch all dashboard data at once
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <WelcomeCard />
      <StatsCards />
      <ActivityChart />
      <RecentItems />
    </Box>
  );
};

export default DashboardPage;
