// src/components/features/home/PlansSection/index.tsx
import { Box, Container, Typography } from "@mui/material";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { GridItem } from "@/components/layout/GridItem";
import { PlanCard } from "./PlanCard";
import { useSubscriptionPlans } from "./useSubscriptionPlans";

export const PlansSection = () => {
  const { plans, loading } = useSubscriptionPlans();

  return (
    <Box sx={{ bgcolor: "grey.100", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
          Flexible options for every network need
        </Typography>

        {loading ? (
          <Typography align="center">Loading plans...</Typography>
        ) : Array.isArray(plans) && plans.length > 0 ? (
          <ResponsiveGrid
            columns={{ xs: 1, md: plans.length > 2 ? 3 : plans.length }}
            sx={{
              justifyContent: "center",
              alignItems: "stretch",
              px: { xs: 2, sm: 0 },
            }}
          >
            {plans.map((plan) => (
              <GridItem key={plan._id}>
                <PlanCard plan={plan} />
              </GridItem>
            ))}
          </ResponsiveGrid>
        ) : (
          <Typography align="center">
            No subscription plans available
          </Typography>
        )}
      </Container>
    </Box>
  );
};
