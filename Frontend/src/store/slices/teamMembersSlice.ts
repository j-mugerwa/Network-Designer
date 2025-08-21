// src/store/slices/teamMembersSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";

export interface TeamMember {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  teams: Array<{
    teamId: string;
    teamName: string;
    role: string;
    joinedAt: string;
  }>;
}

interface TeamMembersState {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
}

const initialState: TeamMembersState = {
  members: [],
  loading: false,
  error: null,
};

// Thunk to fetch members from owned teams
export const fetchMembersFromOwnedTeams = createAsyncThunk<
  TeamMember[],
  void,
  { rejectValue: string }
>("teamMembers/fetchFromOwnedTeams", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/team/members");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch team members"
    );
  }
});

const teamMembersSlice = createSlice({
  name: "teamMembers",
  initialState,
  reducers: {
    clearTeamMembersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Members from Owned Teams
      .addCase(fetchMembersFromOwnedTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembersFromOwnedTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembersFromOwnedTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch team members";
      });
  },
});

export const { clearTeamMembersError } = teamMembersSlice.actions;

// Selectors
export const selectTeamMembers = (state: RootState) =>
  state.teamMembers.members;
export const selectTeamMembersLoading = (state: RootState) =>
  state.teamMembers.loading;
export const selectTeamMembersError = (state: RootState) =>
  state.teamMembers.error;

export default teamMembersSlice.reducer;
