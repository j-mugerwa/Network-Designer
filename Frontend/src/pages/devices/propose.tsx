// src/pages/devices/propose.tsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getEquipmentRecommendations,
  selectCurrentRecommendation,
  selectEquipmentLoading,
  selectEquipmentError,
  clearEquipmentError,
  resetCurrentRecommendation,
} from "@/store/slices/equipmentSlice";
import {
  selectUserDesigns,
  fetchUserDesigns,
  selectDesignsLoading,
} from "@/store/slices/networkDesignSlice";
import type { AppDispatch } from "@/store/store";
import { Alert, CircularProgress, Button, Box } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";
import RecommendationList from "@/components/features/equipment/RecommendationList";
import DesignSelector from "@/components/features/designs/DesignSelector";
import { AppLayout } from "@/components/layout/AppLayout";

const ProposeEquipmentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const designs = useSelector(selectUserDesigns);
  const recommendation = useSelector(selectCurrentRecommendation);
  const equipmentLoading = useSelector(selectEquipmentLoading);
  const error = useSelector(selectEquipmentError);
  const designsLoading = useSelector(selectDesignsLoading);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  // Fetch designs on component mount
  useEffect(() => {
    dispatch(fetchUserDesigns({}));
  }, [dispatch]);

  // Clean up recommendations on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCurrentRecommendation());
    };
  }, [dispatch]);

  const handleGetRecommendations = () => {
    if (selectedDesignId) {
      dispatch(getEquipmentRecommendations(selectedDesignId));
    }
  };

  const handleClearError = () => {
    dispatch(clearEquipmentError());
  };

  return (
    <AppLayout title="Propose Device">
      <Box className="container mx-auto px-4 py-8">
        <PageHeader
          title="Equipment Recommendations"
          subtitle="Get suggested devices based on your network design"
        />

        {error && (
          <Alert severity="error" onClose={handleClearError} sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Box
          className="bg-white rounded-lg shadow p-6 mb-8"
          sx={{ backgroundColor: "background.paper" }}
        >
          <h3 className="text-lg font-medium mb-4">Select a Network Design</h3>

          {designsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : designs.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No designs available. Please create a design first.
            </Alert>
          ) : (
            <Box className="flex flex-col md:flex-row gap-4 items-end">
              <DesignSelector
                designs={designs}
                selectedDesignId={selectedDesignId}
                onSelectDesign={setSelectedDesignId}
                className="flex-grow"
              />
              <Button
                variant="contained"
                onClick={handleGetRecommendations}
                disabled={!selectedDesignId || equipmentLoading}
                sx={{
                  height: 56,
                  minWidth: 200,
                }}
              >
                {equipmentLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Get Recommendations"
                )}
              </Button>
            </Box>
          )}
        </Box>

        {equipmentLoading && !recommendation && (
          <Box display="flex" justifyContent="center" my={8}>
            <CircularProgress />
          </Box>
        )}

        {recommendation && (
          <Box
            className="bg-white rounded-lg shadow p-6"
            sx={{ backgroundColor: "background.paper" }}
          >
            <RecommendationList recommendation={recommendation} />
          </Box>
        )}
      </Box>
    </AppLayout>
  );
};

export default ProposeEquipmentPage;
