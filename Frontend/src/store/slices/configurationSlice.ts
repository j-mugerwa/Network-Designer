// src/store/slices/configurationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { isCancel } from "axios";
import { RootState } from "@/store/store";
import {
  ConfigurationTemplate,
  Deployment,
  UserReference,
  Variable,
  ConfigFile,
  DeploymentStatus,
} from "@/types/configuration";

interface ConfigurationState {
  templates: ConfigurationTemplate[];
  deployments: Deployment[];
  compatibleTemplates: ConfigurationTemplate[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deploying: boolean;
  uploadingFile: boolean;
  currentTemplate: ConfigurationTemplate | null;
}

const initialState: ConfigurationState = {
  templates: [],
  deployments: [],
  compatibleTemplates: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deploying: false,
  uploadingFile: false,
  currentTemplate: null,
};

// Thunks
export const createConfigurationTemplate = createAsyncThunk<
  ConfigurationTemplate,
  FormData,
  { rejectValue: string }
>("configuration/createTemplate", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post("/configs", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to create configuration template"
    );
  }
});

/*
export const fetchAllTemplates = createAsyncThunk<
  ConfigurationTemplate[],
  void,
  { rejectValue: string }
>("configuration/fetchAllTemplates", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/configs/");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch configuration templates"
    );
  }
});
*/

export const fetchAllTemplates = createAsyncThunk<
  ConfigurationTemplate[],
  void,
  { rejectValue: string }
>("configuration/fetchAllTemplates", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/configs/");
    return response.data.data || []; // Fallback for empty array
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch configuration templates"
    );
  }
});

// Fetch templates for specific user

export const fetchUserTemplates = createAsyncThunk<
  ConfigurationTemplate[],
  { signal?: AbortSignal },
  { rejectValue: string }
>(
  "configuration/fetchUserTemplates",
  async ({ signal }, { rejectWithValue }) => {
    try {
      const response = await axios.get("/configs/user", { signal });
      return response.data.data;
    } catch (error: any) {
      if (isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch user templates"
      );
    }
  }
);

// Fetch all templates (admin only)
export const fetchAllTemplatesAdmin = createAsyncThunk<
  ConfigurationTemplate[],
  void,
  { rejectValue: string }
>("configuration/fetchAllTemplatesAdmin", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/configs/admin/all");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch all templates"
    );
  }
});

export const fetchTemplateById = createAsyncThunk<
  ConfigurationTemplate,
  string,
  { rejectValue: string }
>("configuration/fetchTemplateById", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/configs/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch configuration template"
    );
  }
});

export const updateConfigurationTemplate = createAsyncThunk<
  ConfigurationTemplate,
  { id: string; formData: FormData },
  { rejectValue: string }
>(
  "configuration/updateTemplate",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/configs/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update configuration template"
      );
    }
  }
);

export const deployConfiguration = createAsyncThunk<
  Deployment,
  {
    templateId: string;
    deviceId: string;
    variables?: Record<string, string>;
    notes?: string;
    file?: File;
  },
  { rejectValue: string }
>(
  "configuration/deploy",
  async (
    { templateId, deviceId, variables, notes, file },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("deviceId", deviceId);
      if (variables) formData.append("variables", JSON.stringify(variables));
      if (notes) formData.append("notes", notes);
      if (file) formData.append("configFile", file);

      const response = await axios.post(
        `/configs/${templateId}/deploy`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.data.deployment;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to deploy configuration"
      );
    }
  }
);

export const fetchDeviceDeploymentHistory = createAsyncThunk<
  Deployment[],
  string,
  { rejectValue: string }
>(
  "configuration/fetchDeploymentHistory",
  async (deviceId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/devices/${deviceId}/config-deployments`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch deployment history"
      );
    }
  }
);

export const deleteConfigurationTemplate = createAsyncThunk<
  string, // Return the ID of the deleted template
  string, // The template ID to delete
  { rejectValue: string }
>("configuration/deleteTemplate", async (templateId, { rejectWithValue }) => {
  try {
    await axios.delete(`/configs/${templateId}`);
    return templateId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to delete configuration template"
    );
  }
});

export const downloadConfigurationFile = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("configuration/downloadFile", async (templateId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/configs/${templateId}/file`, {
      responseType: "blob",
    });

    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `configuration-${templateId}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to download configuration file"
    );
  }
});

export const fetchCompatibleTemplates = createAsyncThunk<
  ConfigurationTemplate[],
  string,
  { rejectValue: string }
>(
  "configuration/fetchCompatibleTemplates",
  async (deviceId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/devices/${deviceId}/compatible-templates`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch compatible templates"
      );
    }
  }
);

export const updateDeploymentStatus = createAsyncThunk<
  Deployment,
  {
    templateId: string;
    deploymentId: string;
    status: DeploymentStatus;
    notes?: string;
  },
  { rejectValue: string }
>(
  "configuration/updateDeploymentStatus",
  async ({ templateId, deploymentId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/configs/${templateId}/deployments/${deploymentId}`,
        { status, notes }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update deployment status"
      );
    }
  }
);

const configurationSlice = createSlice({
  name: "configuration",
  initialState,
  reducers: {
    clearConfigurationError: (state) => {
      state.error = null;
    },
    resetCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
    clearConfigurationState: (state) => {
      state.templates = [];
      state.deployments = [];
      state.compatibleTemplates = [];
      state.error = null;
      state.currentTemplate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create template
      .addCase(createConfigurationTemplate.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createConfigurationTemplate.fulfilled, (state, action) => {
        state.creating = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createConfigurationTemplate.rejected, (state, action) => {
        state.creating = false;
        state.error =
          action.payload || "Failed to create configuration template";
      })

      // Fetch all templates
      .addCase(fetchAllTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAllTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch configuration templates";
      })

      // Fetch template by ID
      .addCase(fetchTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch configuration template";
      })
      // Fetch user templates
      .addCase(fetchUserTemplates.pending, (state) => {
        //console.time("fetchUserTemplates");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTemplates.fulfilled, (state, action) => {
        //console.timeEnd("fetchUserTemplates");
        state.loading = false;
        state.templates = action.payload || [];
      })
      .addCase(fetchUserTemplates.rejected, (state, action) => {
        state.loading = false;
        // Only set error if it's not a cancellation
        if (action.payload !== "Request canceled") {
          state.error = action.payload || "Failed to fetch user templates";
        }
      })

      // Fetch all templates (admin)
      .addCase(fetchAllTemplatesAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTemplatesAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAllTemplatesAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch all templates";
      })

      // Update template
      .addCase(updateConfigurationTemplate.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateConfigurationTemplate.fulfilled, (state, action) => {
        state.updating = false;
        state.templates = state.templates.map((template) =>
          template._id === action.payload._id ? action.payload : template
        );
        if (state.currentTemplate?._id === action.payload._id) {
          state.currentTemplate = action.payload;
        }
      })
      .addCase(updateConfigurationTemplate.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update configuration template";
      })

      // Deploy configuration
      .addCase(deployConfiguration.pending, (state) => {
        state.deploying = true;
        state.error = null;
      })
      .addCase(deployConfiguration.fulfilled, (state, action) => {
        state.deploying = false;
        // Add to deployments array
        state.deployments.unshift(action.payload);
        // Update template's deployments if it's the current template
        if (state.currentTemplate?._id === action.meta.arg.templateId) {
          state.currentTemplate.deployments.unshift(action.payload);
        }
      })
      .addCase(deployConfiguration.rejected, (state, action) => {
        state.deploying = false;
        state.error = action.payload || "Failed to deploy configuration";
      })

      // Fetch deployment history
      .addCase(fetchDeviceDeploymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceDeploymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.deployments = action.payload;
      })
      .addCase(fetchDeviceDeploymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch deployment history";
      })

      // Download configuration file (no state changes, just error handling)
      .addCase(downloadConfigurationFile.rejected, (state, action) => {
        state.error = action.payload || "Failed to download configuration file";
      })

      // Fetch compatible templates
      .addCase(fetchCompatibleTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompatibleTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.compatibleTemplates = action.payload;
      })
      .addCase(fetchCompatibleTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch compatible templates";
      })

      // Update deployment status
      .addCase(updateDeploymentStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateDeploymentStatus.fulfilled, (state, action) => {
        state.updating = false;
        // Update in deployments array
        state.deployments = state.deployments.map((deployment) =>
          deployment._id === action.payload._id ? action.payload : deployment
        );
        // Update in current template's deployments if present
        if (state.currentTemplate) {
          state.currentTemplate.deployments =
            state.currentTemplate.deployments.map((deployment) =>
              deployment._id === action.payload._id
                ? action.payload
                : deployment
            );
        }
      })
      .addCase(updateDeploymentStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Failed to update deployment status";
      })
      .addCase(deleteConfigurationTemplate.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      //Template Deleting
      .addCase(deleteConfigurationTemplate.fulfilled, (state, action) => {
        state.updating = false;
        // Remove the template from the templates array
        state.templates = state.templates.filter(
          (template) => template._id !== action.payload
        );
        // Clear current template if it's the one being deleted
        if (state.currentTemplate?._id === action.payload) {
          state.currentTemplate = null;
        }
      })
      .addCase(deleteConfigurationTemplate.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to delete configuration template";
      });
  },
});

export const {
  clearConfigurationError,
  resetCurrentTemplate,
  clearConfigurationState,
} = configurationSlice.actions;

// Selectors
export const selectAllTemplates = (state: RootState) =>
  state.configuration.templates;
export const selectTemplateLoading = (state: RootState) =>
  state.configuration.loading;
export const selectTemplateError = (state: RootState) =>
  state.configuration.error;
export const selectTemplateCreating = (state: RootState) =>
  state.configuration.creating;
export const selectTemplateUpdating = (state: RootState) =>
  state.configuration.updating;
export const selectTemplateDeploying = (state: RootState) =>
  state.configuration.deploying;
export const selectCurrentTemplate = (state: RootState) =>
  state.configuration.currentTemplate || undefined;
export const selectDeployments = (state: RootState) =>
  state.configuration.deployments;
export const selectCompatibleTemplates = (state: RootState) =>
  state.configuration.compatibleTemplates;

export const selectUserTemplates = (userId: string) => (state: RootState) =>
  state.configuration.templates.filter((template) => {
    const createdBy = template.createdBy;

    // Type guard to check if createdBy is UserReference
    const isUserReference = (obj: any): obj is UserReference =>
      typeof obj === "object" && "_id" in obj;

    if (isUserReference(createdBy)) {
      return createdBy._id === userId;
    }
    return createdBy === userId;
  });

export const selectAdminTemplates = (state: RootState) =>
  state.configuration.templates;

export default configurationSlice.reducer;
