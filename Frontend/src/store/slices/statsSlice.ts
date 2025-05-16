import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";

interface StatsState {
  users: number;
  companies: number;
  designs: number;
  reports: number;
  loading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  users: 0,
  companies: 0,
  designs: 0,
  reports: 0,
  loading: false,
  error: null,
};

export const fetchSystemStats = createAsyncThunk(
  "stats/fetchSystemStats",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/stats");
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemStats.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.companies = action.payload.companies;
        state.designs = action.payload.designs;
        state.reports = action.payload.reports;
      })
      .addCase(fetchSystemStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default statsSlice.reducer;
