// src/pages/team/members/index.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import TeamMembersTable from "@/components/features/team/TeamMembersTable";
import { useRouter } from "next/router";

const TeamMembersPage = () => {
  //const dispatch = useAppDispatch<AppDispatch>();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleCreateTeam = () => {
    router.push("/team/create");
  };

  const handleViewTeams = () => {
    router.push("/team");
  };

  return (
    <AppLayout title="Team Members">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Team Members"
          subtitle="View all members across your teams"
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
              All Team Members
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleViewTeams}
              >
                View Teams
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateTeam}
              >
                Create Team
              </Button>
            </Box>
          </Box>

          <TeamMembersTable />
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamMembersPage;
