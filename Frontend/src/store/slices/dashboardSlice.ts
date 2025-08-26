// src/store/slices/dashboardSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";

interface ActivityData {
  labels: string[];
  signIns: number[];
  designsCreated: number[];
}

interface DashboardStats {
  designsCreated: number;
  designsOptimized: number;
  designsVisualized: number;
  teamsCreated: number;
  individualsInvited: number;
  invitationsAccepted: number;
  invitationsPending: number;
  invitationsDeclined: number;
}

interface RecentItem {
  _id: string;
  name?: string;
  title?: string;
  createdAt: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  recentItems: {
    designs: RecentItem[];
    reports: RecentItem[];
    notifications: RecentItem[];
  } | null;
  activityData: ActivityData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  recentItems: null,
  activityData: null,
  loading: false,
  error: null,
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/dashboard");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentItems = action.payload.recentItems;
        state.activityData = action.payload.activityData;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
