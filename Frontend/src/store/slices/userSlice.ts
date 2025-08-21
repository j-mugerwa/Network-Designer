import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "../store";

// Types
interface SubscriptionPlan {
  name: string;
  price: number;
  features?: string[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  subscription: {
    status: string;
    plan: SubscriptionPlan;
    startDate?: string;
    endDate?: string;
    nextPaymentDate?: string;
    paystackSubscriptionCode?: string;
  };
  trial?: {
    used: boolean;
    expiresAt: string;
  };
  createdAt?: string;
  lastLogin?: string;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  usersList: UserProfile[]; // For admin
  passwordReset: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  subscription: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
}

// Initial state
const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  usersList: [],
  passwordReset: {
    loading: false,
    error: null,
    success: false,
  },
  subscription: {
    loading: false,
    error: null,
    success: false,
  },
};

// Async thunks
export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/users/me");
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData: Partial<UserProfile>, thunkAPI) => {
    try {
      const response = await axios.patch("/users/profile", profileData);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "user/getProfile",
  async (userId: string, thunkAPI) => {
    try {
      const response = await axios.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/users");
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (email: string, thunkAPI) => {
    try {
      const response = await axios.post("/users/forgot-password", {
        email,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Password reset failed"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async (
    {
      token,
      newPassword,
      email,
    }: { token: string; newPassword: string; email: string },
    thunkAPI
  ) => {
    try {
      const response = await axios.post("/users/reset-password", {
        token,
        newPassword,
        email,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Password reset failed"
      );
    }
  }
);

export const convertTrialToPaid = createAsyncThunk(
  "user/convertTrial",
  async (
    {
      plan_code,
      payment_reference,
    }: { plan_code: string; payment_reference?: string },
    thunkAPI
  ) => {
    try {
      const response = await axios.post("/users/convert-trial", {
        plan_code,
        payment_reference,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Subscription conversion failed"
      );
    }
  }
);

export const clearUserCache = createAsyncThunk(
  "user/clearCache",
  async (_, thunkAPI) => {
    try {
      const response = await axios.post("/users/clear-cache");
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Cache clearance failed"
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetPasswordResetState: (state) => {
      state.passwordReset = {
        loading: false,
        error: null,
        success: false,
      };
    },
    resetSubscriptionState: (state) => {
      state.subscription = {
        loading: false,
        error: null,
        success: false,
      };
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get user profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        // This could be stored differently if you want to keep both current user and viewed profiles
        state.currentUser = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.usersList = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
        state.passwordReset.success = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.passwordReset.loading = false;
        state.passwordReset.success = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload as string;
      })

      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
        state.passwordReset.success = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordReset.loading = false;
        state.passwordReset.success = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload as string;
      })

      // Convert trial to paid
      .addCase(convertTrialToPaid.pending, (state) => {
        state.subscription.loading = true;
        state.subscription.error = null;
        state.subscription.success = false;
      })
      .addCase(convertTrialToPaid.fulfilled, (state, action) => {
        state.subscription.loading = false;
        state.subscription.success = true;
        if (state.currentUser) {
          state.currentUser = {
            ...state.currentUser,
            subscription: action.payload.user.subscription,
            trial: {
              used: true,
              expiresAt:
                state.currentUser.trial?.expiresAt || new Date().toISOString(), // Default value
            },
          };
        }
      })
      .addCase(convertTrialToPaid.rejected, (state, action) => {
        state.subscription.loading = false;
        state.subscription.error = action.payload as string;
      })

      // Clear cache
      .addCase(clearUserCache.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearUserCache.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(clearUserCache.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectUsersList = (state: RootState) => state.user.usersList;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectPasswordResetState = (state: RootState) =>
  state.user.passwordReset;
export const selectSubscriptionState = (state: RootState) =>
  state.user.subscription;

export const {
  resetPasswordResetState,
  resetSubscriptionState,
  clearUserError,
} = userSlice.actions;
export default userSlice.reducer;
