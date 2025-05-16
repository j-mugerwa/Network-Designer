// src/components/pages/HomePage.tsx
import { Box } from "@mui/material";
import { HeroSection } from "@/components/features/home/HeroSection";
import { ImpactSection } from "@/components/features/home/ImpactSection";
import { PlansSection } from "@/components/features/home/PlansSection";
import { useAppSelector } from "@/store/store";

export const HomePage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HeroSection isAuthenticated={isAuthenticated} />
      <ImpactSection />
      <PlansSection />
    </Box>
  );
};
