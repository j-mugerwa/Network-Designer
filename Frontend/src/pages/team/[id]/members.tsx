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

const TeamMembersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = router.query;
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Router query id:", id, "Type:", typeof id);
    console.log("Router query:", router.query);

    // Handle the case where id is the string "undefined"
    if (id === "undefined") {
      console.error("Received 'undefined' string as team ID");
      // Try to get the ID from the URL path as a fallback
      const pathParts = router.asPath.split("/");
      const pathId = pathParts[pathParts.length - 1];
      if (pathId && pathId !== "members" && pathId !== "undefined") {
        console.log("Using ID from URL path:", pathId);
        setTeamId(pathId);
        return;
      }
      return;
    }

    if (id && typeof id === "string" && id !== "undefined") {
      console.log("Setting teamId:", id);
      setTeamId(id);
    } else if (Array.isArray(id) && id.length > 0 && id[0] !== "undefined") {
      console.log("Setting teamId from array:", id[0]);
      setTeamId(id[0]);
    }
  }, [id, router.asPath]);

  const handleBack = () => {
    router.push("/team/");
  };

  const handleInvite = () => {
    if (teamId) {
      router.push(`/team/${teamId}/invite`);
    }
  };

  console.log("Current teamId state:", teamId);

  // Check if we have a valid teamId
  if (!teamId || teamId === "undefined") {
    return (
      <AppLayout title="Team Members">
        <div className="container mx-auto px-4 py-8">
          <Alert severity="error">
            Team ID is missing or invalid. Please go back and try again.
          </Alert>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Router ID: {JSON.stringify(id)}
          </Typography>
          <Typography variant="body2">Current path: {router.asPath}</Typography>
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

export default TeamMembersPage;
