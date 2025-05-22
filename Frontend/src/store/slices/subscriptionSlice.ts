// src/store/slices/subscriptionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";

interface PaymentInitializationResponse {
  authorization_url: string;
  reference: string;
}

interface InitializePaymentParams {
  email: string;
  planId: string;
}

interface PaymentEvent {
  event: string;
  payload: Record<string, any>;
}

interface AnalyticsData {
  summary: Array<{
    _id: string;
    count: number;
    lastOccurrence: string;
  }>;
  recentEvents: Array<Record<string, any>>;
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  features: Record<string, any>;
  isActive: boolean;
  paystackPlanCode: string;
  interval: "monthly" | "yearly";
  billingPeriod: string;
}

interface SubscriptionState {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  currentSubscription: any;
  paymentUrl: string | null;
  paymentLoading: boolean;
  paymentError: string | null;
  //Payments
  analytics: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  eventTrackingLoading: boolean;
  eventTrackingError: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  loading: false,
  error: null,
  currentSubscription: null,
  paymentUrl: null,
  paymentLoading: false,
  paymentError: null,
  //Payments
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,
  eventTrackingLoading: false,
  eventTrackingError: null,
};

// Fetch active plans
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

// Create subscription
// Create subscription
export const createSubscription = createAsyncThunk<
  any,
  { planId: string; authorization_code: string },
  { rejectValue: string }
>(
  "subscriptions/create",
  async ({ planId, authorization_code }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/subscriptions", {
        planId,
        authorization_code,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create subscription"
      );
    }
  }
);

// Initialize payment
/*
export const initializePayment = createAsyncThunk(
  "subscriptions/initializePayment",
  async ({ email, planId }: { email: string; planId: string }, thunkAPI) => {
    try {
      const response = await axios.post("/subscriptions/initialize-payment", {
        email,
        planId,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to initialize payment"
      );
    }
  }
);
*/
export const initializePayment = createAsyncThunk<
  PaymentInitializationResponse,
  InitializePaymentParams,
  { rejectValue: string }
>(
  "subscriptions/initializePayment",
  async ({ email, planId }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/subscriptions/initialize-payment", {
        email,
        planId,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to initialize payment"
      );
    }
  }
);

//Payment verification
export const verifyPayment = createAsyncThunk(
  "subscriptions/verifyPayment",
  async (reference: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/subscriptions/verify-payment`, {
        params: { reference },
      });

      // properly store the data.
      if (response.data.user && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Payment verification failed"
      );
    }
  }
);

// Track payment event
export const trackPaymentEvent = createAsyncThunk<
  { event: string; sessionId: string; timestamp: string },
  PaymentEvent,
  { rejectValue: string }
>(
  "subscriptions/trackPaymentEvent",
  async ({ event, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/subscriptions/track-payment-event", {
        event,
        payload,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to track payment event"
      );
    }
  }
);

// Get payment analytics
export const getPaymentAnalytics = createAsyncThunk<
  AnalyticsData,
  { startDate?: string; endDate?: string; eventType?: string },
  { rejectValue: string }
>(
  "subscriptions/getPaymentAnalytics",
  async ({ startDate, endDate, eventType }, { rejectWithValue }) => {
    try {
      const response = await axios.get("/subscriptions/payment-analytics", {
        params: { startDate, endDate, eventType },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch payment analytics"
      );
    }
  }
);

// Get subscription details
export const getSubscriptionDetails = createAsyncThunk(
  "subscriptions/details",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/subscriptions/details");
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch subscription details"
      );
    }
  }
);

// Cancel subscription
export const cancelSubscription = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("subscriptions/cancel", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.post("/subscriptions/cancel");
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to cancel subscription"
    );
  }
});

// Upgrade subscription
export const upgradeSubscription = createAsyncThunk(
  "subscriptions/upgrade",
  async (newPlanId: string, thunkAPI) => {
    try {
      const response = await axios.put("/subscriptions/upgrade", { newPlanId });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to upgrade subscription"
      );
    }
  }
);

// Downgrade subscription
export const downgradeSubscription = createAsyncThunk(
  "subscriptions/downgrade",
  async (newPlanId: string, thunkAPI) => {
    try {
      const response = await axios.put("/subscriptions/downgrade", {
        newPlanId,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to downgrade subscription"
      );
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.paymentUrl = null;
      state.paymentLoading = false;
      state.paymentError = null;
    },
    resetSubscriptionState: (state) => {
      state.currentSubscription = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch plans
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
      })
      //Create Subscription.
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Initialize payment
      .addCase(initializePayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
        state.paymentUrl = null;
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentUrl = action.payload.authorization_url;
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload || "Payment initialization failed";
      })

      //Payment Verification:
      .addCase(verifyPayment.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.paymentLoading = false;
        // Subscription status can be updated here
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload as string;
      })
      // Track payment event
      .addCase(trackPaymentEvent.pending, (state) => {
        state.eventTrackingLoading = true;
        state.eventTrackingError = null;
      })
      .addCase(trackPaymentEvent.fulfilled, (state) => {
        state.eventTrackingLoading = false;
      })
      .addCase(trackPaymentEvent.rejected, (state, action) => {
        state.eventTrackingLoading = false;
        state.eventTrackingError =
          action.payload || "Failed to track payment event";
      })
      // Get payment analytics
      .addCase(getPaymentAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(getPaymentAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(getPaymentAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload || "Failed to fetch analytics";
      })
      // Get subscription details
      .addCase(getSubscriptionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(getSubscriptionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      //Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.loading = false;
        state.currentSubscription = null; // Clear current subscription after cancellation
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPaymentState, resetSubscriptionState } =
  subscriptionSlice.actions;
export default subscriptionSlice.reducer;
