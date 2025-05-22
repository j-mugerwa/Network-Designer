// src/components/features/dashboard/ActivityChart.tsx
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ChartData,
  ChartDataset,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { useEffect } from "react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type CombinedChartData = ChartData<"line", number[], string> & {
  datasets: Array<
    ChartDataset<"line", number[]> | ChartDataset<"bar", number[]>
  >;
};

const ActivityChart = () => {
  const { activityData, loading, error } = useAppSelector(
    (state) => state.dashboard
  );

  // Loading state
  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="rectangular" height={400} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error" variant="h6">
            Error loading activity data: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const data: CombinedChartData = {
    labels: activityData?.labels || [],
    datasets: [
      {
        label: "Sign Ins",
        data: activityData?.signIns || [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
        yAxisID: "y",
        type: "line",
      },
      {
        label: "Designs Created",
        data: activityData?.designsCreated || [],
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y1",
        type: "line",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: "Your Activity Trends (Last 30 Days)",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Sign Ins",
        },
        min: 0,
        ticks: {
          stepSize: 1,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Designs Created",
        },
        min: 0,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Activity Overview
          </Typography>
        </Box>
        <Box sx={{ height: "400px" }}>
          {activityData ? (
            <Line options={options} data={data} />
          ) : (
            <Typography>No activity data available</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;
