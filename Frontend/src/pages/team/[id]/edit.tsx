// src/pages/team/[id]/edit.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppDispatch } from "@/store/store";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import EditTeamForm from "@/components/features/team/EditTeamForm";
import { useRouter } from "next/router";
import { ArrowBack } from "@mui/icons-material";
import { fetchTeamDetails } from "@/store/slices/teamSlice";

const EditTeamPage = () => {
  //const dispatch = useDispatch<AppDispatch>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { id } = router.query;
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === "string") {
      setTeamId(id);
      // Fetch team details to ensure we have the latest data
      dispatch(fetchTeamDetails(id));
    }
  }, [id, dispatch]);

  const handleBack = () => {
    router.push("/team");
  };

  const handleSuccess = () => {
    // You can add a success message or redirect here
    router.push("/team");
  };

  if (!teamId) {
    return (
      <AppLayout title="Edit Team">
        <div className="container mx-auto px-4 py-8">
          <Alert severity="error">Team ID is required</Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Team">
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
            title="Edit Team"
            subtitle="Update your team information"
          />
        </Box>

        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <EditTeamForm teamId={teamId} onSuccess={handleSuccess} />
        </div>
      </div>
    </AppLayout>
  );
};

export default EditTeamPage;
