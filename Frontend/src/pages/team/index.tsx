// src/pages/teams/index.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserTeams,
  selectTeams,
  selectTeamLoading,
  selectTeamError,
  clearTeamError,
} from "@/store/slices/teamSlice";
import { RootState } from "@/store/store";
import type { AppDispatch } from "@/store/store";
import TeamsTable from "@/components/features/team/TeamsTable";
import { Alert, CircularProgress } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@mui/material";
import { useRouter } from "next/router";

const TeamsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const teams = useSelector(selectTeams);
  const loading = useSelector(selectTeamLoading);
  const error = useSelector(selectTeamError);

  useEffect(() => {
    dispatch(fetchUserTeams());
  }, [dispatch]);

  const handleClearError = () => {
    dispatch(clearTeamError());
  };

  const handleCreateTeam = () => {
    router.push("/teams/create");
  };

  return (
    <AppLayout title="My Teams">
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="My Teams" subtitle="View and manage your teams" />

        {error && (
          <Alert severity="error" onClose={handleClearError} className="mb-4">
            {typeof error === "string" ? error : "Failed to load teams"}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center">
            <CircularProgress />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <TeamsTable />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeamsPage;
