// src/pages/team/[id]/members.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import MembersTable from "@/components/features/team/MembersTable";
import { useRouter } from "next/router";
import { ArrowBack } from "@mui/icons-material";

const TeamMembersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = router.query;

  const handleBack = () => {
    router.push("/team/");
  };

  const handleInvite = () => {
    router.push(`/team/${id}/invite`);
  };

  if (!id) {
    return (
      <AppLayout title="Team Members">
        <div className="container mx-auto px-4 py-8">
          <Alert severity="error">Team ID is required</Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Team Members">
      <div className="container mx-auto px-4 py-8">
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            variant="outlined"
          >
            Back to Teams
          </Button>
          <PageHeader
            title="Team Members"
            subtitle="Manage team members and permissions"
          />
        </Box>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom="1px solid rgba(224, 224, 224, 1)"
          >
            <Typography variant="h6" component="div">
              Members
            </Typography>
            <Button variant="contained" color="primary" onClick={handleInvite}>
              Invite Member
            </Button>
          </Box>

          <MembersTable teamId={id as string} />
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamMembersPage;
