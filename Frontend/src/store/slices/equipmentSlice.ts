// src/store/slices/equipmentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";
import {
  Equipment,
  EquipmentState,
  UserEquipmentResponse,
  RecommendationItem,
  EquipmentRecommendation,
  EquipmentAssignment,
  DesignEquipmentAssignment,
  DesignEquipmentResponse,
} from "@/types/equipment";

interface RemoveEquipmentFromDesignPayload {
  designId: string;
  equipmentIds: string[]; // Just IDs for removal
}

const initialState: EquipmentState = {
  equipment: [],
  userEquipment: [],
  systemEquipment: [],
  recommendations: [],
  loading: false,
  error: null,
  currentRecommendation: null,
  creating: false,
  updating: false,
  deleting: false,
  uploadingImage: false,
  designEquipment: [],
  assigningToDesign: false,
  removingFromDesign: false,
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

export const fetchUserEquipment = createAsyncThunk<
  Equipment[],
  void,
  { rejectValue: string }
>("equipment/fetchUserEquipment", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<UserEquipmentResponse>("/equipment/user/");
    console.log("Full API response:", response.data);

    if (!response.data.success) {
      return rejectWithValue("API request failed");
    }

    return response.data.data; // Directly return the equipment array
  } catch (error: any) {
    console.error("API error:", error);
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch user equipment"
    );
  }
});

export const fetchSystemEquipment = createAsyncThunk<
  Equipment[],
  void,
  { rejectValue: string }
>("equipment/fetchSystemEquipment", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/equipment?systemOwned=true");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch system equipment"
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

export const createSystemEquipment = createAsyncThunk<
  Equipment,
  FormData,
  { rejectValue: string }
>("equipment/createSystem", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post("/equipment/system", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create system equipment"
    );
  }
});

export const updateEquipmentDetails = createAsyncThunk<
  Equipment,
  { id: string; formData: FormData },
  { rejectValue: string }
>("equipment/update", async ({ id, formData }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`/equipment/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to update equipment"
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
    if (!response.data.success) {
      return rejectWithValue(
        response.data.error || "Failed to get recommendations"
      );
    }
    return response.data.data;
  } catch (error: any) {
    console.error("Recommendation fetch failed:", error);
    return rejectWithValue(
      error.response?.data?.error ||
        error.message ||
        "Failed to get recommendations"
    );
  }
});

export const deleteEquipmentItem = createAsyncThunk<
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

export const fetchEquipmentByCategory = createAsyncThunk<
  Equipment[],
  string,
  { rejectValue: string }
>("equipment/byCategory", async (category, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/equipment/category/${category}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch equipment by category"
    );
  }
});

export const fetchSimilarEquipment = createAsyncThunk<
  Equipment[],
  string,
  { rejectValue: string }
>("equipment/similar", async (equipmentId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/equipment/similar/${equipmentId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch similar equipment"
    );
  }
});

export const fetchEquipmentById = createAsyncThunk<
  Equipment,
  string,
  { rejectValue: string }
>("equipment/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/equipment/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch equipment"
    );
  }
});

//Assign equipment to a design:
export const assignEquipmentToDesign = createAsyncThunk<
  DesignEquipmentResponse,
  DesignEquipmentAssignment,
  { rejectValue: string }
>(
  "equipment/assignToDesign",
  async ({ designId, equipment }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/equipment/assign-to-design", {
        designId,
        equipment,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to assign equipment to design"
      );
    }
  }
);

//Remove Equipment from design:

export const removeEquipmentFromDesign = createAsyncThunk<
  DesignEquipmentResponse,
  RemoveEquipmentFromDesignPayload,
  { rejectValue: string }
>(
  "equipment/removeFromDesign",
  async ({ designId, equipmentIds }, { rejectWithValue }) => {
    try {
      const response = await axios.delete("/equipment/remove-from-design", {
        data: { designId, equipmentIds },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to remove equipment from design"
      );
    }
  }
);

//Fetch equipment for a design:

export const fetchDesignEquipment = createAsyncThunk<
  Equipment[],
  string,
  { rejectValue: string }
>("equipment/fetchDesignEquipment", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/equipment/design/${designId}`);
    // Ensure each device has an id field
    const devices = response.data.data.map((device: any) => ({
      ...device,
      id: device.id || device._id, // Handle both id and _id cases
    }));
    return devices;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch design equipment"
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
    clearEquipmentState: (state) => {
      state.equipment = [];
      state.userEquipment = [];
      state.systemEquipment = [];
      state.recommendations = [];
      state.currentRecommendation = null;
      state.error = null;
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

      // Fetch user equipment
      .addCase(fetchUserEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserEquipment.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Storing equipment:", action.payload);
        state.userEquipment = action.payload;
      })
      .addCase(fetchUserEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch user equipment";
      })
      // Fetch system equipment
      .addCase(fetchSystemEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.systemEquipment = action.payload;
      })
      .addCase(fetchSystemEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch system equipment";
      })

      // Create new equipment
      .addCase(createNewEquipment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewEquipment.fulfilled, (state, action) => {
        state.creating = false;
        state.userEquipment.unshift(action.payload);
        state.equipment.unshift(action.payload);
      })
      .addCase(createNewEquipment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create equipment";
      })

      // Create system equipment
      .addCase(createSystemEquipment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createSystemEquipment.fulfilled, (state, action) => {
        state.creating = false;
        state.systemEquipment.unshift(action.payload);
        state.equipment.unshift(action.payload);
      })
      .addCase(createSystemEquipment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create system equipment";
      })

      // Update equipment
      .addCase(updateEquipmentDetails.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateEquipmentDetails.fulfilled, (state, action) => {
        state.updating = false;
        const updatedEquipment = action.payload;

        // Update in all relevant arrays
        state.equipment = state.equipment.map((item) =>
          item.id === updatedEquipment.id ? updatedEquipment : item
        );
        state.userEquipment = state.userEquipment.map((item) =>
          item.id === updatedEquipment.id ? updatedEquipment : item
        );
        state.systemEquipment = state.systemEquipment.map((item) =>
          item.id === updatedEquipment.id ? updatedEquipment : item
        );
      })
      .addCase(updateEquipmentDetails.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Failed to update equipment";
      })

      // Get recommendations
      .addCase(getEquipmentRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentRecommendation = null;
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
      .addCase(deleteEquipmentItem.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteEquipmentItem.fulfilled, (state, action) => {
        state.deleting = false;
        const deletedId = action.payload;
        state.equipment = state.equipment.filter(
          (item) => item.id !== deletedId
        );
        state.userEquipment = state.userEquipment.filter(
          (item) => item.id !== deletedId
        );
        state.systemEquipment = state.systemEquipment.filter(
          (item) => item.id !== deletedId
        );
      })
      .addCase(deleteEquipmentItem.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete equipment";
      })

      // Fetch by category
      .addCase(fetchEquipmentByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.equipment = action.payload;
      })
      .addCase(fetchEquipmentByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch equipment by category";
      })

      // Fetch similar equipment
      .addCase(fetchSimilarEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilarEquipment.fulfilled, (state, action) => {
        state.loading = false;
        // Store similar equipment in a temporary array or handle as needed
      })
      .addCase(fetchSimilarEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch similar equipment";
      })
      //Fetch equipment by id
      .addCase(fetchEquipmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentById.fulfilled, (state, action) => {
        state.loading = false;
        // Add to equipment array if not already present
        if (!state.equipment.some((item) => item.id === action.payload.id)) {
          state.equipment.push(action.payload);
        }
      })
      .addCase(fetchEquipmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch equipment";
      })
      // Assign equipment to design
      .addCase(assignEquipmentToDesign.pending, (state) => {
        state.assigningToDesign = true;
        state.error = null;
      })
      .addCase(assignEquipmentToDesign.fulfilled, (state, action) => {
        state.assigningToDesign = false;
        // Merge new devices with existing ones, avoiding duplicates
        const newDevices = action.payload.data.devices || [];
        const existingDeviceIds = state.designEquipment.map((d) => d.id);

        state.designEquipment = [
          ...state.designEquipment,
          ...newDevices.filter(
            (device: Equipment) => !existingDeviceIds.includes(device.id)
          ),
        ];
      })
      .addCase(assignEquipmentToDesign.rejected, (state, action) => {
        state.assigningToDesign = false;
        state.error = action.payload || "Failed to assign equipment to design";
      })

      // Remove equipment from design
      .addCase(removeEquipmentFromDesign.pending, (state) => {
        state.removingFromDesign = true;
        state.error = null;
      })
      .addCase(removeEquipmentFromDesign.fulfilled, (state, action) => {
        state.removingFromDesign = false;
        const removedIds = action.meta.arg.equipmentIds;
        state.designEquipment = state.designEquipment.filter(
          (eq) => !removedIds.includes(eq.id)
        );
      })
      .addCase(removeEquipmentFromDesign.rejected, (state, action) => {
        state.removingFromDesign = false;
        state.error =
          action.payload || "Failed to remove equipment from design";
      })

      // Fetch design equipment
      .addCase(fetchDesignEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesignEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.designEquipment = action.payload;
      })
      .addCase(fetchDesignEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch design equipment";
      });
  },
});

export const {
  clearEquipmentError,
  resetCurrentRecommendation,
  clearEquipmentState,
} = equipmentSlice.actions;

// Selectors
export const selectAllEquipment = (state: RootState) =>
  state.equipment.equipment;
export const selectUserEquipment = (state: RootState) =>
  state.equipment.userEquipment;
export const selectSystemEquipment = (state: RootState) =>
  state.equipment.systemEquipment;
export const selectEquipmentLoading = (state: RootState) =>
  state.equipment.loading;
export const selectEquipmentError = (state: RootState) => state.equipment.error;
export const selectEquipmentCreating = (state: RootState) =>
  state.equipment.creating;
export const selectEquipmentUpdating = (state: RootState) =>
  state.equipment.updating;
export const selectEquipmentDeleting = (state: RootState) =>
  state.equipment.deleting;
export const selectEquipmentRecommendations = (state: RootState) =>
  state.equipment.recommendations;
export const selectCurrentRecommendation = (state: RootState) =>
  state.equipment.currentRecommendation;
export const selectEquipmentByCategory =
  (category: string) => (state: RootState) =>
    state.equipment.equipment.filter(
      (item: Equipment) => item.category === category
    );

export const selectDesignEquipment = (state: RootState) =>
  state.equipment.designEquipment;
export const selectAssigningToDesign = (state: RootState) =>
  state.equipment.assigningToDesign;
export const selectRemovingFromDesign = (state: RootState) =>
  state.equipment.removingFromDesign;
export default equipmentSlice.reducer;
