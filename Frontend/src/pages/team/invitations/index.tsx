// src/pages/team/invitations/index.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import InvitationsTable from "@/components/features/team/InvitationsTable";
import { useRouter } from "next/router";

const InvitationsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleNewInvitation = () => {
    router.push("/team/invite");
  };

  return (
    <AppLayout title="Team Invitations">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Sent Invitations"
          subtitle="View and manage your team invitations"
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
              Invitations
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNewInvitation}
            >
              New Invitation
            </Button>
          </Box>

          <InvitationsTable />
        </div>
      </div>
    </AppLayout>
  );
};

export default InvitationsPage;
