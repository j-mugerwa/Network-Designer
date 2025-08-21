// src/pages/team/[id]/members.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import MembersTable from "@/components/features/team/MembersTable";
import { useRouter } from "next/router";
import { ArrowBack } from "@mui/icons-material";
import { GetServerSideProps } from "next";

interface TeamMembersPageProps {
  teamId: string | null;
}

const TeamMembersPage: React.FC<TeamMembersPageProps> = ({ teamId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleBack = () => {
    router.push("/team/");
  };

  const handleInvite = () => {
    if (teamId) {
      router.push(`/team/${teamId}/invite`);
    }
  };

  console.log("Team ID from server props:", teamId);

  if (!teamId) {
    return (
      <AppLayout title="Team Members">
        <div className="container mx-auto px-4 py-8">
          <Alert severity="error">
            Team ID is missing or invalid. Please go back and try again.
          </Alert>
          <Button onClick={handleBack} sx={{ mt: 2 }}>
            Back to Teams
          </Button>
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

          <MembersTable teamId={teamId} />
        </div>
      </div>
    </AppLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};

  console.log("ServerSideProps - Team ID:", id);

  // Check if id is valid
  if (
    !id ||
    id === "undefined" ||
    (Array.isArray(id) && id[0] === "undefined")
  ) {
    return {
      props: {
        teamId: null,
      },
    };
  }

  // Handle both string and array cases
  const teamId = Array.isArray(id) ? id[0] : id;

  return {
    props: {
      teamId,
    },
  };
};

export default TeamMembersPage;
