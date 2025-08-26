// src/pages/designs/assign-to-team/index.tsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  Alert,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { GridItem } from "@/components/layout/GridItem";
import AssignDesignToTeam from "@/components/features/designs/AssignDesignToTeam";
import {
  fetchUserDesigns,
  selectUserDesigns,
  selectDesignsLoading,
} from "@/store/slices/networkDesignSlice";
import { useRouter } from "next/router";

const AssignDesignToTeamPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const designs = useSelector(selectUserDesigns);
  const loading = useSelector(selectDesignsLoading);
  const [error, setError] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        // Fetch user's designs with pagination parameters
        await dispatch(fetchUserDesigns({ page: 1, limit: 100 })).unwrap();
      } catch (err: any) {
        setError(err.message || "Failed to load designs");
      }
    };

    loadDesigns();
  }, [dispatch]);

  const handleAssignClick = (design: any) => {
    setSelectedDesign(design);
    setDialogOpen(true);
  };

  const handleAssignmentSuccess = () => {
    // Optionally refresh data or show success message
    router.push("/designs"); // Redirect to designs page after success
  };

  const handleBackToDesigns = () => {
    router.push("/designs");
  };

  if (loading) {
    return (
      <AppLayout title="Assign Design to Team">
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <Typography>Loading designs...</Typography>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Assign Design to Team">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Assign Design to Team"
          subtitle="Select a design to assign to one of your teams"
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom="1px solid rgba(224, 224, 224, 1)"
          >
            <Typography variant="h6" component="div">
              Your Designs
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBackToDesigns}
            >
              Back to Designs
            </Button>
          </Box>

          <Box p={3}>
            {designs.length === 0 ? (
              <Typography variant="body1" textAlign="center" py={4}>
                No designs available to assign.
              </Typography>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                gap={3}
              >
                {designs.map((design) => (
                  <GridItem key={design.id}>
                    <Card variant="outlined" sx={{ width: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {design.designName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          gutterBottom
                        >
                          Created:{" "}
                          {new Date(design.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          gutterBottom
                        >
                          Status: {design.designStatus}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleAssignClick(design)}
                        >
                          Assign to Team
                        </Button>
                      </CardContent>
                    </Card>
                  </GridItem>
                ))}
              </Box>
            )}
          </Box>
        </div>

        {selectedDesign && (
          <AssignDesignToTeam
            designId={selectedDesign.id}
            designName={selectedDesign.designName}
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSuccess={handleAssignmentSuccess}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default AssignDesignToTeamPage;
