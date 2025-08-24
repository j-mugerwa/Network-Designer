import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";
import {
  NetworkDesignUI,
  NetworkDesign,
  DesignStatus,
  CreateDesignPayload,
  UpdateDesignPayload,
  DesignCreationResponse,
} from "@/types/networkDesign";

interface DesignState {
  designs: NetworkDesignUI[];
  currentDesign: NetworkDesignUI | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const initialState: DesignState = {
  designs: [],
  currentDesign: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  },
};

// Utility function to convert NetworkDesign to NetworkDesignUI
const convertToUI = (design: NetworkDesign): NetworkDesignUI => {
  // Parse dates if they're strings
  const parseDate = (dateString: string | Date) => {
    return typeof dateString === "string"
      ? new Date(dateString).toISOString()
      : dateString.toISOString();
  };

  return {
    id: design._id?.toString() || "",
    userId: design.userId.toString(),
    designName: design.designName,
    description: design.description,
    isExistingNetwork: design.isExistingNetwork,
    existingNetworkDetails: design.existingNetworkDetails,
    requirements: design.requirements,
    designStatus: design.designStatus,
    version: design.version,
    isTemplate: design.isTemplate,
    deviceCount: design.deviceCount || 0,
    reportCount: design.reports?.length || 0,
    createdAt: design.createdAt
      ? parseDate(design.createdAt)
      : new Date().toISOString(),
    updatedAt: design.updatedAt
      ? parseDate(design.updatedAt)
      : new Date().toISOString(),
    lastModified: design.lastModified
      ? parseDate(design.lastModified)
      : undefined,
  };
};

// Thunks
// Design Creation thunk.
export const createDesign = createAsyncThunk<
  NetworkDesignUI,
  CreateDesignPayload,
  { rejectValue: string }
>("designs/create", async (designData, { rejectWithValue }) => {
  try {
    const response = await axios.post<DesignCreationResponse>(
      "/networkdesign",
      designData
    );
    const design = response.data.design;
    return "_id" in design ? convertToUI(design) : design;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create design"
    );
  }
});

export const fetchUserDesigns = createAsyncThunk<
  { designs: NetworkDesignUI[]; pagination: any },
  { page?: number; limit?: number; status?: string; search?: string },
  { rejectValue: string }
>(
  "designs/fetchAll",
  async ({ page = 1, limit = 10, status, search }, { rejectWithValue }) => {
    try {
      console.log("Fetching designs with params:", {
        page,
        limit,
        status,
        search,
      });
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const response = await axios.get<{
        data: NetworkDesign[];
        pagination: any;
      }>(`/networkdesign?${params.toString()}`);
      console.log("API Response:", response.data);
      return {
        designs: response.data.data.map(convertToUI),
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Fetch designs error:", error);
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch designs"
      );
    }
  }
);

export const fetchTeamDesigns = createAsyncThunk<
  { designs: NetworkDesignUI[]; pagination: any },
  {
    teamId: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  "designs/fetchTeamDesigns",
  async (
    { teamId, page = 1, limit = 10, status, search },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const response = await axios.get<{
        data: any[];
        pagination: any;
      }>(`/networkdesign/${teamId}?${params.toString()}`);

      return {
        designs: response.data.data.map(convertToUI),
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch team designs"
      );
    }
  }
);

export const assignDesignToTeam = createAsyncThunk<
  NetworkDesignUI,
  { designId: string; teamId: string },
  { rejectValue: string }
>("designs/assignToTeam", async ({ designId, teamId }, { rejectWithValue }) => {
  try {
    const response = await axios.put<{ data: NetworkDesign }>(
      `/networkdesign/${designId}/assign-to-team`,
      { teamId }
    );
    return convertToUI(response.data.data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to assign design to team"
    );
  }
});

// Thunk for removing design from team
export const removeDesignFromTeam = createAsyncThunk<
  NetworkDesignUI,
  string, // designId only since teamId comes from the design itself
  { rejectValue: string }
>("designs/removeFromTeam", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.put<{ data: NetworkDesign }>(
      `/networkdesign/${designId}/remove-from-team`
    );
    return convertToUI(response.data.data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to remove design from team"
    );
  }
});

export const fetchDesignById = createAsyncThunk<
  NetworkDesignUI,
  string,
  { rejectValue: string }
>("designs/fetchOne", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.get<{ data: NetworkDesign }>(
      `/networkdesign/${designId}`
    );
    return convertToUI(response.data.data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch design"
    );
  }
});

//Update Thunk
export const updateDesign = createAsyncThunk<
  NetworkDesignUI,
  { id: string; designData: UpdateDesignPayload },
  { rejectValue: string }
>("designs/update", async ({ id, designData }, { rejectWithValue }) => {
  try {
    const response = await axios.put<DesignCreationResponse>(
      `/networkdesign/${id}`,
      designData
    );
    const design = response.data.design;
    // Ensure we return a properly formatted NetworkDesignUI
    return {
      ...("_id" in design ? convertToUI(design) : design),
      id: id, // Explicitly set the id
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to update design"
    );
  }
});

export const archiveDesign = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("designs/archive", async (designId, { rejectWithValue }) => {
  try {
    await axios.put(`/networkdesign/${designId}/archive`);
    return designId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to archive design"
    );
  }
});

const designSlice = createSlice({
  name: "designs",
  initialState,
  reducers: {
    resetDesignState: () => initialState,
    setCurrentDesign: (
      state,
      action: PayloadAction<NetworkDesignUI | null>
    ) => {
      state.currentDesign = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create design
      .addCase(createDesign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDesign.fulfilled, (state, action) => {
        state.loading = false;
        state.designs.unshift(action.payload);
        state.currentDesign = action.payload;
      })
      .addCase(createDesign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create design";
      })

      // Fetch all user designs
      .addCase(fetchUserDesigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDesigns.fulfilled, (state, action) => {
        state.loading = false;
        state.designs = action.payload.designs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserDesigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch designs";
      })

      //Fetch team designs
      .addCase(fetchTeamDesigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamDesigns.fulfilled, (state, action) => {
        state.loading = false;
        state.designs = action.payload.designs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeamDesigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch team designs";
      })

      //Assign a design to a team:
      .addCase(assignDesignToTeam.fulfilled, (state, action) => {
        if (action.payload) {
          // Update the design in the list
          state.designs = state.designs.map((design) =>
            design.id === action.payload.id ? action.payload : design
          );
          if (state.currentDesign?.id === action.payload.id) {
            state.currentDesign = action.payload;
          }
        }
      })
      .addCase(assignDesignToTeam.rejected, (state, action) => {
        state.error = action.payload || "Failed to assign design to team";
      })

      // Remove design from team
      .addCase(removeDesignFromTeam.fulfilled, (state, action) => {
        if (action.payload) {
          // Update the design in the list
          state.designs = state.designs.map((design) =>
            design.id === action.payload.id ? action.payload : design
          );
          if (state.currentDesign?.id === action.payload.id) {
            state.currentDesign = action.payload;
          }
        }
      })
      .addCase(removeDesignFromTeam.rejected, (state, action) => {
        state.error = action.payload || "Failed to remove design from team";
      })

      // Fetch single design
      .addCase(fetchDesignById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesignById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDesign = action.payload;
      })
      .addCase(fetchDesignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch design";
      })

      // Update design
      .addCase(updateDesign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDesign.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentDesign = action.payload;
          if (action.payload.id) {
            state.designs = state.designs.map((design) =>
              design.id === action.payload.id ? action.payload : design
            );
          }
        }
      })
      .addCase(updateDesign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update design";
      })

      // Archive design
      .addCase(archiveDesign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(archiveDesign.fulfilled, (state, action) => {
        state.loading = false;
        state.designs = state.designs.filter(
          (design) => design.id !== action.payload
        );
        if (state.currentDesign?.id === action.payload) {
          state.currentDesign = null;
        }
      })
      .addCase(archiveDesign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to archive design";
      });
  },
});

export const { resetDesignState, setCurrentDesign } = designSlice.actions;
export const selectDesigns = (state: RootState) => state.designs;
export const selectUserDesigns = (state: RootState) => state.designs.designs;
export const selectDesignsLoading = (state: RootState) => state.designs.loading;
export default designSlice.reducer;
