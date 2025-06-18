// src/store/slices/networkReportsSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";
import type { WritableDraft } from "immer/dist/types/types-external";

// Remove the DesignOption interface since we'll use the one from networkDesignSlice
import { NetworkDesignUI } from "@/types/networkDesign";

interface Report {
  id: string;
  designId: string;
  designName: string;
  userId: string;
  reportType: string;
  title: string;
  format: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportsState {
  reports: Report[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  lastGeneratedReport: Report | null;
}

const initialState: ReportsState = {
  reports: [],
  loading: false,
  generating: false,
  error: null,
  lastGeneratedReport: null,
};

// Thunks
export const fetchUserReports = createAsyncThunk<
  Report[],
  void,
  { rejectValue: string }
>("reports/fetchUserReports", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/report/");
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch reports"
    );
  }
});

export const generateProfessionalReport = createAsyncThunk<
  Report,
  string,
  { rejectValue: string }
>("reports/generateProfessional", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/report/prof/${designId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to generate professional report"
    );
  }
});

/*
export const downloadReport = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("reports/download", async (reportId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/report/${reportId}/download`, {
      responseType: "blob",
    });

    // Create download link and trigger click
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Get filename from content-disposition header or use a default
    const contentDisposition = response.headers["content-disposition"];
    let filename = `report_${reportId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to download report"
    );
  }
});
*/

// src/store/slices/networkReportsSlice.ts
export const downloadReport = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("report/download", async (reportId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/report/download/${reportId}`, {
      responseType: "blob",
    });

    // Create download link and trigger click
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Get filename from content-disposition header or use a default
    const contentDisposition = response.headers["content-disposition"];
    let filename = `report_${reportId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to download report"
    );
  }
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportsError: (state) => {
      state.error = null;
    },
    resetLastGeneratedReport: (state) => {
      state.lastGeneratedReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user reports
      .addCase(fetchUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch reports";
      })

      // Generate professional report
      .addCase(generateProfessionalReport.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateProfessionalReport.fulfilled, (state, action) => {
        state.generating = false;
        state.lastGeneratedReport = action.payload;
        // Add to reports list if not already present
        if (!state.reports.some((report) => report.id === action.payload.id)) {
          state.reports.unshift(action.payload);
        }
      })
      .addCase(generateProfessionalReport.rejected, (state, action) => {
        state.generating = false;
        state.error =
          action.payload || "Failed to generate professional report";
      })

      // Download report
      .addCase(downloadReport.pending, (state) => {
        state.error = null;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.error = action.payload || "Failed to download report";
      });
  },
});

export const { clearReportsError, resetLastGeneratedReport } =
  reportsSlice.actions;

export const selectReports = (state: RootState) => state.reports.reports;
export const selectReportsLoading = (state: RootState) => state.reports.loading;
export const selectReportGenerating = (state: RootState) =>
  state.reports.generating;
export const selectReportsError = (state: RootState) => state.reports.error;
export const selectLastGeneratedReport = (state: RootState) =>
  state.reports.lastGeneratedReport;

export default reportsSlice.reducer;
