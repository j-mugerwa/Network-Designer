// app/reports/page.tsx
"use client"; // Make sure this is uncommented

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchUserReports,
  downloadReport,
  selectReports,
  selectReportsLoading,
  selectReportsError,
  clearReportsError,
} from "@/store/slices/networkReportSlice";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReports);
  const loading = useAppSelector(selectReportsLoading);
  const error = useAppSelector(selectReportsError);

  useEffect(() => {
    dispatch(fetchUserReports());
  }, [dispatch]);

  const handleDownload = (reportId: string) => {
    dispatch(downloadReport(reportId));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => dispatch(clearReportsError())}>
        {error}
      </Alert>
    );
  }

  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    try {
      // First try parsing as ISO string
      const date = parseISO(dateString);
      return format(date, "PPpp");
    } catch (e) {
      try {
        // If that fails, try using the string directly
        return format(new Date(dateString), "PPpp");
      } catch (e) {
        console.error("Invalid date format:", dateString);
        return "Invalid date";
      }
    }
  };

  return (
    <AppLayout title="Generated Reports">
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4">My Reports</Typography>
            <Link href="/reports/generate" passHref>
              <Button variant="contained" color="primary">
                Generate New Report
              </Button>
            </Link>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {reports.map((report) => (
              <Card
                key={report.id}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {report.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Design: {report.designName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generated: {formatDate(report.createdAt)}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleDownload(report.id)}
                  >
                    Download
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>
    </AppLayout>
  );
}
