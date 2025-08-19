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
  pendingInvitations: TeamInvitation[];
  invitationStatus: "idle" | "checking" | "registration_required";
  sentInvitations: Array<{
    inviteeName: any;
    id: string;
    email: string;
    name?: string;
    team: {
      id: string;
      name: string;
    };
    role: "admin" | "member";
    status: "pending" | "accepted" | "expired";
    createdAt: string;
    expiresAt: string;
  }>;
  invitationsLoading: boolean;
}

const initialState: TeamState = {
  teams: [],
  currentTeam: null,
  teamDesigns: null,
  loading: false,
  processing: false,
  error: null,
  lastOperation: null,
  pendingInvitations: [],
  invitationStatus: "idle",
  sentInvitations: [],
  invitationsLoading: false,
};

// Thunks

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

// Fetch User teams
export const fetchUserTeams = createAsyncThunk<
  Team[],
  void,
  { rejectValue: string }
>("team/fetchAll", async (_, { rejectWithValue }) => {
  try {
    console.log("Fetching teams..."); // Debug log
    const response = await axios.get("/team");
    console.log("Teams response:", response.data); // Debug log
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching teams:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
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

//Handle Member Invitation
export const inviteTeamMember = createAsyncThunk<
  { isNewUser: boolean }, // Return whether this is a new user
  { teamId: string; data: InviteMemberPayload & { company?: string } },
  { rejectValue: string }
>(
  "team/inviteMember",
  async ({ teamId, data }, { rejectWithValue, getState }) => {
    try {
      // Get company from current user if not provided
      const state = getState() as RootState;
      const company = data.company || state.user.currentUser?.company;

      const response = await axios.post(`/team/${teamId}/invite`, {
        ...data,
        company, // Include company in invitation
      });
      return response.data; // Should include isNewUser flag
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to send invitation"
      );
    }
  }
);

//Invitation Acceptance.
export const acceptTeamInvitation = createAsyncThunk<
  { team: Team; authToken?: string },
  { token: string; password?: string },
  {
    rejectValue: {
      message: string;
      requiresRegistration?: boolean;
      email?: string;
      company?: string;
    };
  }
>("team/acceptInvite", async ({ token, password }, { rejectWithValue }) => {
  try {
    const response = await axios.post("/team/accept-invite", {
      token,
      ...(password && { password }),
    });

    if (!response.data.data?.team) {
      throw new Error("Team data missing from response");
    }

    //return response.data;
    return {
      team: response.data.data.team,
      authToken: response.data.data.authToken,
    };
  } catch (error: any) {
    if (error.response?.data?.status === "registration_required") {
      return rejectWithValue({
        message: error.response.data.error || "Registration required",
        requiresRegistration: true,
        email: error.response.data.email,
        company: error.response.data.company,
      });
    }
    return rejectWithValue({
      message: error.response?.data?.error || "Failed to accept invitation",
    });
  }
});

// Check invitation validity (for the accept page)
export const checkInvitation = createAsyncThunk<
  { email: string; company: string },
  string,
  { rejectValue: string }
>("team/checkInvite", async (token, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/team/check-invite?token=${token}`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Invalid invitation");
  }
});

//Decline Invitation
export const declineTeamInvitation = createAsyncThunk<
  void,
  { token: string },
  { rejectValue: { message: string } }
>("team/declineInvite", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await axios.post("/team/decline-invite", { token });
    return response.data;
  } catch (error: any) {
    return rejectWithValue({
      message: error.response?.data?.error || "Failed to decline invitation",
    });
  }
});

//Fetch Invitations sent.
export const fetchSentInvitations = createAsyncThunk(
  "team/fetchSentInvitations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/team/invitations/sent");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch invitations"
      );
    }
  }
);

//Delete an invitation
export const deleteInvitation = createAsyncThunk(
  "team/deleteInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/team/invitations/${invitationId}`);
      return invitationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete invitation"
      );
    }
  }
);

// Resend invitation
export const resendInvitation = createAsyncThunk(
  "team/resendInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/team/invitations/${invitationId}/resend`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to resend invitation"
      );
    }
  }
);

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
      .addCase(acceptTeamInvitation.fulfilled, (state, action) => {
        state.processing = false;
        const { team, authToken } = action.payload;

        // Add team if not already in state
        if (!state.teams.some((t) => t.id === team.id)) {
          state.teams.unshift(team);
        }
        state.currentTeam = team; // Set as current team
        state.lastOperation = "inviteAccepted";
      })
      .addCase(acceptTeamInvitation.rejected, (state, action) => {
        state.processing = false;
        if (action.payload?.requiresRegistration) {
          state.invitationStatus = "registration_required";
        } else {
          state.error =
            action.payload?.message || "Failed to accept invitation";
        }
      })

      // Check Invitation
      .addCase(checkInvitation.pending, (state) => {
        state.invitationStatus = "checking";
        state.error = null;
      })
      .addCase(checkInvitation.fulfilled, (state, action) => {
        state.invitationStatus = "registration_required";
        // Store invitation details if needed
      })
      .addCase(checkInvitation.rejected, (state, action) => {
        state.invitationStatus = "idle";
        state.error = action.payload || "Invalid invitation";
      })

      // Fetch Sent Invitations
      .addCase(fetchSentInvitations.pending, (state) => {
        state.invitationsLoading = true;
      })
      .addCase(fetchSentInvitations.fulfilled, (state, action) => {
        state.invitationsLoading = false;
        state.sentInvitations = action.payload;
      })
      .addCase(fetchSentInvitations.rejected, (state, action) => {
        state.invitationsLoading = false;
        state.error = action.payload as string;
      })

      // Delete Invitation
      .addCase(deleteInvitation.fulfilled, (state, action) => {
        state.sentInvitations = state.sentInvitations.filter(
          (inv) => inv.id !== action.payload
        );
      })

      // Resend Invitation
      .addCase(resendInvitation.fulfilled, (state, action) => {
        const index = state.sentInvitations.findIndex(
          (inv) => inv.id === action.payload.id
        );
        if (index !== -1) {
          state.sentInvitations[index] = action.payload;
        }
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
export const selectSentInvitations = (state: RootState) =>
  state.team.sentInvitations;
export const selectInvitationsLoading = (state: RootState) =>
  state.team.invitationsLoading;
export const selectTeams = (state: RootState) => state.team.teams;
export const selectCurrentTeam = (state: RootState) => state.team.currentTeam;
export const selectTeamDesigns = (state: RootState) => state.team.teamDesigns;
export const selectTeamLoading = (state: RootState) => state.team.loading;
export const selectTeamProcessing = (state: RootState) => state.team.processing;
export const selectTeamError = (state: RootState) => state.team.error;
export const selectLastTeamOperation = (state: RootState) =>
  state.team.lastOperation;

export default teamSlice.reducer;
