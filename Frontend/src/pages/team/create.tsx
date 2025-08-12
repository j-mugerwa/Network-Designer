// src/pages/teams/create.tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  createTeam,
  selectTeamProcessing as selectTeamCreating,
  selectTeamError,
  clearTeamError,
} from "@/store/slices/teamSlice";
import type { AppDispatch } from "@/store/store";
import CreateTeamForm from "@/components/features/team/CreateTeamForm";
import { Alert, CircularProgress } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";

const CreateTeamPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const creating = useSelector(selectTeamCreating);
  const error = useSelector(selectTeamError);

  const handleSubmit = async (data: { name: string; description?: string }) => {
    const result = await dispatch(createTeam(data));
    if (createTeam.fulfilled.match(result)) {
      router.push("/team");
    }
  };

  const handleClearError = () => {
    dispatch(clearTeamError());
  };

  return (
    <AppLayout title="Create Team">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Create New Team"
          subtitle="Organize your work by creating a new team"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} className="mb-4">
            {error}
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {creating ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : (
            <CreateTeamForm onSuccess={() => router.push("/team")} />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateTeamPage;
