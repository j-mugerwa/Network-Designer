import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isActive: boolean;
}

interface SubscriptionState {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  loading: false,
  error: null,
};

export const fetchSubscriptionPlans = createAsyncThunk(
  "subscriptions/fetchPlans",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/subscriptions/activeplans");
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch plans"
      );
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default subscriptionSlice.reducer;
