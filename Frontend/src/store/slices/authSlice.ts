import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import axios from "@/lib/api/client";
import apiClient from "@/lib/api/client";
import { RootState } from "../store";

// Update the getLocalStorageItem helper function
const getLocalStorageItem = (key: string) => {
  if (typeof window !== "undefined") {
    const item = localStorage.getItem(key);
    return item === "undefined" ? null : item; // Handle 'undefined' string case
  }
  return null;
};

// Types
interface AuthUser {
  //_id: string;
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

// Update the initial state
const initialState: AuthState = {
  user:
    typeof window !== "undefined"
      ? JSON.parse(getLocalStorageItem("user") || "null") // Now safe from 'undefined' strings
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
    planId: string;
  },
  { rejectValue: string }
>(
  "auth/registerUser",
  async ({ email, password, name, company, role, terms, planId }, thunkAPI) => {
    try {
      const response = await axios.post<{
        user: AuthUser;
        token: string;
      }>("/users/register", {
        name,
        email,
        company,
        role,
        password,
        terms,
        planId,
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
    // 1. First authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 2. Get the ID token
    const idToken = await userCredential.user.getIdToken();

    // 3. Call your backend login endpoint
    const response = await axios.post("/users/login", { idToken });

    // 4. Store the user data
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      token: idToken,
      ...response.data.user, // Include any additional user data from your backend
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", idToken);
    }

    return userData;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Login failed");
  }
});

//Optimized Login

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
          /*
          const response = await axios.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          */

          const userData: AuthUser = {
            //_id: response.data._id,
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
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.token = action.payload.token;
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

//export const selectCurrentUserId = (state: RootState) => state.auth.user?._id;
export const { resetAuthState, setUser } = authSlice.actions;
export default authSlice.reducer;
