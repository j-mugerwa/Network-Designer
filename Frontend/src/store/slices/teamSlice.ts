// src/store/slices/teamSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";
import {
  Team,
  TeamMember,
  TeamInvitation,
  TeamDesignsResponse,
  CreateTeamPayload,
  InviteMemberPayload,
  UpdateTeamPayload,
} from "@/types/team";

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  teamDesigns: TeamDesignsResponse | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  lastOperation: string | null;
}

const initialState: TeamState = {
  teams: [],
  currentTeam: null,
  teamDesigns: null,
  loading: false,
  processing: false,
  error: null,
  lastOperation: null,
};

// Thunks
/*
export const createTeam = createAsyncThunk<
  Team,
  CreateTeamPayload,
  { rejectValue: string }
>("team/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post("/team", payload);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create team"
    );
  }
});
*/

export const createTeam = createAsyncThunk<
  Team,
  CreateTeamPayload,
  { rejectValue: string }
>("team/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post("/team", {
      name: payload.name,
      description: payload.description,
      // members array should contain objects with userId strings
      // that the backend will convert to ObjectIds
      //members: payload.members || [],
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create team"
    );
  }
});

export const fetchUserTeams = createAsyncThunk<
  Team[],
  void,
  { rejectValue: string }
>("team/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/team");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch teams"
    );
  }
});

export const fetchTeamDetails = createAsyncThunk<
  Team,
  string,
  { rejectValue: string }
>("team/fetchDetails", async (teamId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/team/${teamId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch team details"
    );
  }
});

export const updateTeam = createAsyncThunk<
  Team,
  { teamId: string; data: UpdateTeamPayload },
  { rejectValue: string }
>("team/update", async ({ teamId, data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`/team/${teamId}`, data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to update team"
    );
  }
});

export const addTeamMember = createAsyncThunk<
  Team,
  { teamId: string; userId: string; role?: "admin" | "member" },
  { rejectValue: string }
>("team/addMember", async ({ teamId, userId, role }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/team/${teamId}/members`, {
      userId,
      role,
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to add team member"
    );
  }
});

export const inviteTeamMember = createAsyncThunk<
  void,
  { teamId: string; data: InviteMemberPayload },
  { rejectValue: string }
>("team/inviteMember", async ({ teamId, data }, { rejectWithValue }) => {
  try {
    await axios.post(`/team/${teamId}/invite`, data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to send invitation"
    );
  }
});

export const acceptTeamInvitation = createAsyncThunk<
  Team,
  { token: string; teamId: string },
  { rejectValue: string }
>("team/acceptInvite", async ({ token, teamId }, { rejectWithValue }) => {
  try {
    const response = await axios.post("/team/accept-invite", {
      token,
      teamId,
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to accept invitation"
    );
  }
});

export const removeTeamMember = createAsyncThunk<
  Team,
  { teamId: string; memberId: string },
  { rejectValue: string }
>("team/removeMember", async ({ teamId, memberId }, { rejectWithValue }) => {
  try {
    const response = await axios.delete(`/team/${teamId}/members/${memberId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to remove team member"
    );
  }
});

export const fetchTeamDesigns = createAsyncThunk<
  TeamDesignsResponse,
  {
    teamId: string;
    params?: { status?: string; search?: string; page?: number };
  },
  { rejectValue: string }
>("team/fetchDesigns", async ({ teamId, params }, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/team/${teamId}/designs`, { params });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch team designs"
    );
  }
});

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    clearTeamError: (state) => {
      state.error = null;
    },
    resetLastOperation: (state) => {
      state.lastOperation = null;
    },
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Team
      .addCase(createTeam.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.processing = false;
        state.teams.unshift(action.payload);
        state.lastOperation = "create";
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to create team";
      })

      // Fetch User Teams
      .addCase(fetchUserTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload;
      })
      .addCase(fetchUserTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch teams";
      })

      // Fetch Team Details
      .addCase(fetchTeamDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTeam = action.payload;
      })
      .addCase(fetchTeamDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch team details";
      })

      // Update Team
      .addCase(updateTeam.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.processing = false;
        state.teams = state.teams.map((team) =>
          team.id === action.payload.id ? action.payload : team
        );
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
        state.lastOperation = "update";
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to update team";
      })

      // Add Team Member
      .addCase(addTeamMember.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.processing = false;
        state.teams = state.teams.map((team) =>
          team.id === action.payload.id ? action.payload : team
        );
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
        state.lastOperation = "addMember";
      })
      .addCase(addTeamMember.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to add team member";
      })

      // Invite Team Member
      .addCase(inviteTeamMember.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(inviteTeamMember.fulfilled, (state) => {
        state.processing = false;
        state.lastOperation = "inviteSent";
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to send invitation";
      })

      // Accept Team Invitation
      .addCase(acceptTeamInvitation.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(acceptTeamInvitation.fulfilled, (state, action) => {
        state.processing = false;
        if (!state.teams.some((team) => team.id === action.payload.id)) {
          state.teams.unshift(action.payload);
        }
        state.lastOperation = "inviteAccepted";
      })
      .addCase(acceptTeamInvitation.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to accept invitation";
      })

      // Remove Team Member
      .addCase(removeTeamMember.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.processing = false;
        state.teams = state.teams.map((team) =>
          team.id === action.payload.id ? action.payload : team
        );
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
        state.lastOperation = "memberRemoved";
      })
      .addCase(removeTeamMember.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || "Failed to remove team member";
      })

      // Fetch Team Designs
      .addCase(fetchTeamDesigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamDesigns.fulfilled, (state, action) => {
        state.loading = false;
        state.teamDesigns = action.payload;
      })
      .addCase(fetchTeamDesigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch team designs";
      });
  },
});

export const { clearTeamError, resetLastOperation, setCurrentTeam } =
  teamSlice.actions;

// Selectors
export const selectTeams = (state: RootState) => state.team.teams;
export const selectCurrentTeam = (state: RootState) => state.team.currentTeam;
export const selectTeamDesigns = (state: RootState) => state.team.teamDesigns;
export const selectTeamLoading = (state: RootState) => state.team.loading;
export const selectTeamProcessing = (state: RootState) => state.team.processing;
export const selectTeamError = (state: RootState) => state.team.error;
export const selectLastTeamOperation = (state: RootState) =>
  state.team.lastOperation;

export default teamSlice.reducer;
