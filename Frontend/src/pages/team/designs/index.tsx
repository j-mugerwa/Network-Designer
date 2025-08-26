// src/pages/team/designs/index.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { TeamDesignsTable } from "@/components/features/designs/TeamDesignsTable";
import { useRouter } from "next/router";

const TeamDesignsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleBackToTeams = () => {
    router.push("/team");
  };

  return (
    <AppLayout title="Team Designs Management">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Team Designs Management"
          subtitle="View and manage designs assigned to your teams"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom="1px solid rgba(224, 224, 224, 1)"
          >
            <Typography variant="h6" component="div">
              Designs in Your Teams
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBackToTeams}
            >
              Back to Teams
            </Button>
          </Box>

          <TeamDesignsTable />
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamDesignsPage;
