// app/reports/generate/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  generateProfessionalReport,
  selectReportGenerating,
  selectReportsError,
  selectLastGeneratedReport,
  clearReportsError,
  resetLastGeneratedReport,
} from "@/store/slices/networkReportSlice";
import {
  fetchUserDesigns,
  selectDesigns,
} from "@/store/slices/networkDesignSlice";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Container,
} from "@mui/material";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ReportGeneratorPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Get designs from networkDesignSlice
  const { designs, loading: designsLoading } = useAppSelector(selectDesigns);
  const generating = useAppSelector(selectReportGenerating);
  const error = useAppSelector(selectReportsError);
  const lastGeneratedReport = useAppSelector(selectLastGeneratedReport);

  const [selectedDesign, setSelectedDesign] = useState<string>("");

  useEffect(() => {
    // Fetch designs if not already loaded
    if (designs.length === 0) {
      dispatch(fetchUserDesigns({}));
    }
  }, [dispatch, designs.length]);

  useEffect(() => {
    if (lastGeneratedReport) {
      router.push("/reports");
      dispatch(resetLastGeneratedReport());
    }
  }, [lastGeneratedReport, router, dispatch]);

  const handleDesignChange = (event: SelectChangeEvent) => {
    setSelectedDesign(event.target.value);
  };

  const handleGenerateReport = () => {
    if (selectedDesign) {
      dispatch(generateProfessionalReport(selectedDesign));
    }
  };

  if (designsLoading && designs.length === 0) {
    return (
      <AppLayout title="Generate Report">
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ maxWidth: 600, mx: "auto", p: 3, textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading your designs...
            </Typography>
          </Box>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Generate Report">
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Link href="/reports" passHref>
              <Button variant="outlined">Back to Reports</Button>
            </Link>
          </Box>

          <Typography variant="h4" gutterBottom>
            Generate New Report
          </Typography>

          {error && (
            <Alert
              severity="error"
              onClose={() => dispatch(clearReportsError())}
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="design-select-label">Select Design</InputLabel>
            <Select
              labelId="design-select-label"
              id="design-select"
              value={selectedDesign}
              label="Select Design"
              onChange={handleDesignChange}
              disabled={generating || designs.length === 0}
            >
              {designs.length > 0 ? (
                designs.map((design) => (
                  <MenuItem key={design.id} value={design.id}>
                    {design.designName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No designs available
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateReport}
            disabled={!selectedDesign || generating || designs.length === 0}
            fullWidth
          >
            {generating ? (
              <CircularProgress size={24} />
            ) : (
              "Generate Professional Report"
            )}
          </Button>
        </Box>
      </Container>
    </AppLayout>
  );
}
