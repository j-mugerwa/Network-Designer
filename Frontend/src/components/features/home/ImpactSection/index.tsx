// src/components/features/home/ImpactSection/index.tsx
import { Container, Typography } from "@mui/material";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { GridItem } from "@/components/layout/GridItem";
import { StatCard } from "./StatCard";
import { useImpactStats } from "./useImpactStats";

export const ImpactSection = () => {
  const { stats, loading } = useImpactStats();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Our Impact
      </Typography>
      {loading ? (
        <Typography align="center">Loading statistics...</Typography>
      ) : (
        <ResponsiveGrid
          columns={{ xs: 1, sm: 2, md: 4 }}
          sx={{
            justifyContent: "center",
            alignItems: "stretch",
            px: { xs: 2, sm: 0 },
          }}
        >
          {stats.map((stat, index) => (
            <GridItem key={index}>
              <StatCard {...stat} />
            </GridItem>
          ))}
        </ResponsiveGrid>
      )}
    </Container>
  );
};
