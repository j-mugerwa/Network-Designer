import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import axios from "axios";

// Helper function to safely access localStorage
const getLocalStorageItem = (key: string) => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

// Types
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

// Initial state with type
const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? JSON.parse(getLocalStorageItem("user") || "null")
      : null,
  isAuthenticated:
    typeof window !== "undefined" ? !!getLocalStorageItem("user") : false,
  loading: false,
  error: null,
  token: typeof window !== "undefined" ? getLocalStorageItem("token") : null,
};

// Typed async thunks
export const registerUser = createAsyncThunk<
  { user: AuthUser; token: string },
  {
    name: string;
    email: string;
    company: string;
    role: string;
    password: string;
    terms: boolean;
  },
  { rejectValue: string }
>(
  "auth/registerUser",
  async ({ email, password, name, company, role, terms }, thunkAPI) => {
    try {
      const response = await axios.post<{
        user: AuthUser;
        token: string;
      }>("/api/users/register", {
        name,
        email,
        company,
        role,
        password,
        terms, // Add terms to the request
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
      }

      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk<
  AuthUser & { token: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async ({ email, password }, thunkAPI) => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    const token = await user.getIdToken();

    const userData: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
    }

    return { ...userData, token };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Login failed");
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutUser",
  async (_, thunkAPI) => {
    try {
      await signOut(auth);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const checkLoginStatus = createAsyncThunk<
  { loggedIn: boolean; user?: AuthUser; token?: string },
  void,
  { rejectValue: string }
>("auth/checkLoginStatus", async (_, thunkAPI) => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      unsubscribe();

      if (user) {
        try {
          const token = await user.getIdToken();
          const userData: AuthUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            token,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", token);
          }

          resolve({ loggedIn: true, user: userData, token });
        } catch (error) {
          resolve({ loggedIn: false });
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
        resolve({ loggedIn: false });
      }
    });
  });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || "Logout failed";
      })

      // Check login status cases
      .addCase(checkLoginStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkLoginStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.loggedIn;
        state.user = action.payload.loggedIn
          ? action.payload.user || null
          : null;
        state.token = action.payload.loggedIn
          ? action.payload.token || null
          : null;
      })
      .addCase(checkLoginStatus.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
