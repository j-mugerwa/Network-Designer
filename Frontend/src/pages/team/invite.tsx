import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTeamLoading,
  selectTeamError,
  clearTeamError,
  fetchUserTeams,
  selectTeams,
} from "@/store/slices/teamSlice";
import type { AppDispatch } from "@/store/store";
import { Alert, CircularProgress } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import InviteMemberForm from "@/components/features/team/InviteMemberForm";
import { useEffect } from "react";

const TeamInvitePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const loading = useSelector(selectTeamLoading);
  const error = useSelector(selectTeamError);
  const teams = useSelector(selectTeams);

  useEffect(() => {
    dispatch(fetchUserTeams());
  }, [dispatch]);

  const handleClearError = () => {
    dispatch(clearTeamError());
  };

  const handleSuccess = () => {
    router.push("/team");
  };

  return (
    <AppLayout title="Invite to Team">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Invite to Team"
          subtitle="Send an invitation to join one of your teams"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} className="mb-4">
            {typeof error === "string" ? error : "Failed to send invitation"}
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {loading && teams.length === 0 ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : teams.length === 0 ? (
            <Alert severity="info">
              You don't have any teams yet. Create a team first to invite
              members.
            </Alert>
          ) : (
            <InviteMemberForm onSuccess={handleSuccess} teams={teams} />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamInvitePage;
