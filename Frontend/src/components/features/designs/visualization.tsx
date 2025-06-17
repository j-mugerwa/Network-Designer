// src/pages/designs/visualization.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchUserDesigns } from "@/store/slices/networkDesignSlice";
import { TopologyVisualizer } from "@/components/features/topology/topologyVisualizer";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Container,
} from "@mui/material";
import { AppLayout } from "@/components/layout/AppLayout";

const VisualizationPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { designs, loading } = useAppSelector((state) => state.designs);
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");

  useEffect(() => {
    //dispatch(fetchUserDesigns());
    dispatch(
      fetchUserDesigns({
        page: 1,
        limit: 10,
        status: "draft",
      })
    );
  }, [dispatch]);

  const handleDesignChange = (event: any) => {
    setSelectedDesignId(event.target.value as string);
  };

  return (
    <AppLayout title="Network Visualization">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Network Topology Visualization
        </Typography>

        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="design-select-label">
              Select Network Design
            </InputLabel>
            <Select
              labelId="design-select-label"
              id="design-select"
              value={selectedDesignId}
              label="Select Network Design"
              onChange={handleDesignChange}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a design</em>
              </MenuItem>
              {designs.map((design) => (
                <MenuItem key={design.id} value={design.id}>
                  {design.designName} ({design.requirements?.totalUsers} users)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {selectedDesignId && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Network Topology
            </Typography>
            <TopologyVisualizer designId={selectedDesignId} />
          </Box>
        )}

        {!selectedDesignId && !loading && (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Please select a network design to visualize
            </Typography>
          </Box>
        )}
      </Container>
    </AppLayout>
  );
};

export default VisualizationPage;
