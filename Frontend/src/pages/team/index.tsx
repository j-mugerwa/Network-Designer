// src/pages/teams/index.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import TeamsTable from "@/components/features/team/TeamsTable";
import { useRouter } from "next/router";

const TeamsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleCreateTeam = () => {
    router.push("/team/create");
  };

  return (
    <AppLayout title="My Teams">
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="My Teams" subtitle="View and manage your teams" />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom="1px solid rgba(224, 224, 224, 1)"
          >
            <Typography variant="h6" component="div">
              Teams
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTeam}
            >
              Create Team
            </Button>
          </Box>

          <TeamsTable />
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamsPage;
