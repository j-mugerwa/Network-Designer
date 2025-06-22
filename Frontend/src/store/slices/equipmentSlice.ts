// src/store/slices/equipmentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";

interface EquipmentSpecs {
  ports?: number;
  portSpeed?: string;
  throughput?: string;
  wirelessStandards?: string[];
  powerRequirements?: string;
  [key: string]: any;
}

interface Equipment {
  id: string;
  category: string;
  manufacturer: string;
  model: string;
  specs: EquipmentSpecs;
  priceRange: string;
  typicalUseCase: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface RecommendationItem {
  category: string;
  recommendedEquipment: Equipment;
  quantity: number;
  placement: string;
  justification: string;
  alternatives: Equipment[];
}

interface EquipmentRecommendation {
  id: string;
  designId: string;
  recommendations: RecommendationItem[];
  createdAt: string;
}

interface EquipmentState {
  equipment: Equipment[];
  recommendations: EquipmentRecommendation[];
  loading: boolean;
  error: string | null;
  currentRecommendation: EquipmentRecommendation | null;
  creating: boolean;
  deleting: boolean;
}

const initialState: EquipmentState = {
  equipment: [],
  recommendations: [],
  loading: false,
  error: null,
  currentRecommendation: null,
  creating: false,
  deleting: false,
};

// Thunks
export const fetchAllEquipment = createAsyncThunk<
  Equipment[],
  void,
  { rejectValue: string }
>("equipment/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/equipment");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch equipment"
    );
  }
});

export const createNewEquipment = createAsyncThunk<
  Equipment,
  FormData,
  { rejectValue: string }
>("equipment/create", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post("/equipment", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create equipment"
    );
  }
});

export const getEquipmentRecommendations = createAsyncThunk<
  EquipmentRecommendation,
  string,
  { rejectValue: string }
>("equipment/recommendations", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/equipment/recommendations/${designId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to get recommendations"
    );
  }
});

export const deleteEquipment = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("equipment/delete", async (equipmentId, { rejectWithValue }) => {
  try {
    await axios.delete(`/equipment/${equipmentId}`);
    return equipmentId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to delete equipment"
    );
  }
});

const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {
    clearEquipmentError: (state) => {
      state.error = null;
    },
    resetCurrentRecommendation: (state) => {
      state.currentRecommendation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all equipment
      .addCase(fetchAllEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.equipment = action.payload;
      })
      .addCase(fetchAllEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch equipment";
      })

      // Create new equipment
      .addCase(createNewEquipment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewEquipment.fulfilled, (state, action) => {
        state.creating = false;
        state.equipment.unshift(action.payload);
      })
      .addCase(createNewEquipment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create equipment";
      })

      // Get recommendations
      .addCase(getEquipmentRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEquipmentRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecommendation = action.payload;
        // Add to recommendations history if not already present
        if (
          !state.recommendations.some((rec) => rec.id === action.payload.id)
        ) {
          state.recommendations.push(action.payload);
        }
      })
      .addCase(getEquipmentRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to get recommendations";
      })

      // Delete equipment
      .addCase(deleteEquipment.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteEquipment.fulfilled, (state, action) => {
        state.deleting = false;
        state.equipment = state.equipment.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteEquipment.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete equipment";
      });
  },
});

export const { clearEquipmentError, resetCurrentRecommendation } =
  equipmentSlice.actions;

// Selectors
export const selectAllEquipment = (state: RootState) =>
  state.equipment.equipment;
export const selectEquipmentLoading = (state: RootState) =>
  state.equipment.loading;
export const selectEquipmentError = (state: RootState) => state.equipment.error;
export const selectEquipmentCreating = (state: RootState) =>
  state.equipment.creating;
export const selectEquipmentRecommendations = (state: RootState) =>
  state.equipment.recommendations;
export const selectCurrentRecommendation = (state: RootState) =>
  state.equipment.currentRecommendation;

export default equipmentSlice.reducer;
