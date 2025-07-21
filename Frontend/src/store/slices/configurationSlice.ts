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
  DeploymentReportsState,
  ConfigDeployment,
  PaginationData,
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
  deploymentStatus: {
    [templateId: string]: {
      loading: boolean;
      error: string | null;
      lastDeployed?: string;
    };
  };
  deploymentReports: DeploymentReportsState;
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
  deploymentStatus: {},
  deploymentReports: {
    configDeployments: [],
    userDeployments: [],
    loading: false,
    error: null,
    pagination: undefined,
  },
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

//All templates
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

//Fetch template by id
export const fetchTemplateById = createAsyncThunk<
  ConfigurationTemplate,
  string,
  { rejectValue: string }
>("configuration/fetchTemplateById", async (id, { rejectWithValue }) => {
  try {
    if (!id || !isValidObjectId(id)) {
      throw new Error("Invalid template ID format");
    }

    const response = await axios.get(`/configs/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch configuration template"
    );
  }
});

//Helper function
function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

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

//Deploy.
export const deployConfiguration = createAsyncThunk<
  Deployment,
  {
    templateId: string;
    deviceId: string;
    variables?: Record<string, string>;
    notes?: string;
    file?: File;
  },
  { rejectValue: string; state: RootState }
>("configuration/deploy", async (deploymentData, { rejectWithValue }) => {
  try {
    const { templateId, deviceId, variables, notes, file } = deploymentData;
    const formData = new FormData();

    // Don't need to append templateId to formData since it's in the URL
    formData.append("deviceId", deviceId);
    if (variables) formData.append("variables", JSON.stringify(variables));
    if (notes) formData.append("notes", notes);
    if (file) formData.append("configFile", file);

    // Endpoint that matches the route
    const response = await axios.post(
      `/configs/${templateId}/deploy`, // Matches the route
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to deploy configuration"
    );
  }
});

//Deployments by configurations. For All

export const fetchConfigDeployments = createAsyncThunk<
  { data: ConfigDeployment[]; pagination: PaginationData },
  { page?: number; limit?: number; signal?: AbortSignal },
  { rejectValue: string; state: RootState }
>(
  "configuration/fetchConfigDeployments",
  async ({ page = 1, limit = 10, signal }, { rejectWithValue }) => {
    try {
      const response = await axios.get("/configs/deployments/by-config", {
        params: { page, limit },
        timeout: 10000,
        signal,
      });

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      if (isCancel(error)) {
        // Don't treat canceled requests as errors
        console.log("Request was canceled");
        throw error; // This will skip the rejectWithValue
      }
      return rejectWithValue(
        error.response?.data?.error ||
          "Failed to fetch configuration deployments"
      );
    }
  }
);

//Config deployments fo the logged in user.

export const fetchUserDeployments = createAsyncThunk<
  { data: ConfigDeployment[]; pagination: PaginationData },
  { page?: number; limit?: number; signal?: AbortSignal },
  { rejectValue: string; state: RootState }
>(
  "configuration/fetchUserDeployments",
  async ({ page = 1, limit = 10, signal }, { rejectWithValue }) => {
    try {
      const response = await axios.get("/configs/deployments/by-user", {
        params: { page, limit },
        signal,
      });
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      if (isCancel(error)) {
        throw error;
      }
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch user deployments"
      );
    }
  }
);

//Deployment History
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
    setCurrentTemplate: (
      state,
      action: PayloadAction<ConfigurationTemplate>
    ) => {
      state.currentTemplate = action.payload;
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
        state.error = action.payload?.includes("File upload failed")
          ? "Invalid configuration file"
          : action.payload || "Creation failed";
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
      .addCase(deployConfiguration.pending, (state, action) => {
        const { templateId } = action.meta.arg;
        state.deploymentStatus[templateId] = {
          loading: true,
          error: null,
        };
      })
      .addCase(deployConfiguration.fulfilled, (state, action) => {
        const { templateId } = action.meta.arg;
        const deployment = action.payload;

        state.deploymentStatus[templateId] = {
          loading: false,
          error: null,
          lastDeployed: new Date().toISOString(),
        };

        // Update deployments list
        state.deployments.unshift(deployment);

        // Update template's deployments if it's the current template
        if (state.currentTemplate?._id === templateId) {
          if (!state.currentTemplate.deployments) {
            state.currentTemplate.deployments = [];
          }
          state.currentTemplate.deployments.unshift(deployment);
        }
      })
      .addCase(deployConfiguration.rejected, (state, action) => {
        const { templateId } = action.meta.arg;
        state.deploymentStatus[templateId] = {
          loading: false,
          error: action.payload || "Deployment failed",
        };
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
      })
      //Fetch config deployments
      .addCase(fetchConfigDeployments.pending, (state) => {
        state.deploymentReports.loading = true;
        state.deploymentReports.error = null;
      })
      .addCase(fetchConfigDeployments.fulfilled, (state, action) => {
        state.deploymentReports.loading = false;
        state.deploymentReports.configDeployments = action.payload.data;
        state.deploymentReports.pagination = action.payload.pagination;
      })
      .addCase(fetchConfigDeployments.rejected, (state, action) => {
        // Skip state updates for canceled requests
        if (!isCancel(action.error)) {
          state.deploymentReports.loading = false;
          state.deploymentReports.error =
            action.payload || "Failed to fetch deployments";
        }
      })
      .addCase(fetchUserDeployments.pending, (state) => {
        state.deploymentReports.loading = true;
        state.deploymentReports.error = null;
      })
      .addCase(fetchUserDeployments.fulfilled, (state, action) => {
        state.deploymentReports.loading = false;
        state.deploymentReports.userDeployments = action.payload.data;
        state.deploymentReports.pagination = action.payload.pagination;
      })
      .addCase(fetchUserDeployments.rejected, (state, action) => {
        if (!isCancel(action.error)) {
          state.deploymentReports.loading = false;
          state.deploymentReports.error =
            action.payload || "Failed to fetch user deployments";
        }
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

export const selectUserDeployments = (state: RootState) =>
  state.configuration.deploymentReports.userDeployments;

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

export const selectDeploymentStatus =
  (templateId?: string) => (state: RootState) => {
    return templateId
      ? state.configuration.deploymentStatus[templateId] || {
          loading: false,
          error: null,
        }
      : {
          loading: false,
          error: null,
        };
  };

export const selectLastDeployment =
  (templateId: string) => (state: RootState) => {
    return state.configuration.deployments.find(
      (d) => d.template === templateId
    );
  };

export const selectConfigDeployments = (state: RootState) =>
  state.configuration.deploymentReports.configDeployments;

export const selectConfigDeploymentsLoading = (state: RootState) =>
  state.configuration.deploymentReports.loading;

export const selectConfigDeploymentsError = (state: RootState) =>
  state.configuration.deploymentReports.error;

export const selectConfigDeploymentById =
  (configId: string) => (state: RootState) =>
    state.configuration.deploymentReports.configDeployments.find(
      (config) => config._id === configId
    );

// Optional: Selector for deployments by status
export const selectDeploymentsByStatus =
  (status: DeploymentStatus) => (state: RootState) => {
    return state.configuration.deploymentReports.configDeployments.flatMap(
      (config) =>
        config.deployments
          .filter((deployment) => deployment.status === status)
          .map((deployment) => ({
            ...deployment,
            configName: config.name,
            configVersion: config.version,
          }))
    );
  };

export default configurationSlice.reducer;
