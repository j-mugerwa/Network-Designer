import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/api/client";
import { RootState } from "@/store/store";
import type { WritableDraft } from "immer/dist/types/types-external";

export interface Node {
  id: string;
  label: string;
  type: string;
  level: number;
  model?: string;
  vlan?: number;
  subnet?: string;
  interfaces?: Array<{
    name: string;
    ip: string;
    connectedTo: string;
  }>;
  // Visualization properties (marked as optional)
  color?: {
    background: string;
    border: string;
  };
  shape?: string;
  size?: number;
}

export interface Edge {
  from: string;
  to: string;
  label: string;
  type: string;
  bandwidth: string;
  // Visualization properties (marked as optional)
  color?: string;
  width?: number;
  dashes?: boolean;
}

export interface Topology {
  id: string;
  designId: string;
  userId: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
  title?: string;
  description?: string;
}

interface TopologyState {
  currentTopology: Topology | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  lastUpdated: number | null;
}

const initialState: TopologyState = {
  currentTopology: null,
  loading: false,
  error: null,
  generating: false,
  lastUpdated: null,
};

// Helper function to create a draft-compatible node
const createEnhancedNode = (node: WritableDraft<Node>): Node => ({
  ...node,
  color: {
    background: getNodeColor(node.type),
    border: "#2B2B2B",
  },
  shape:
    node.type === "router"
      ? "diamond"
      : node.type === "firewall"
      ? "star"
      : node.type === "accesspoint"
      ? "triangle"
      : "box",
  size: node.type === "router" ? 25 : node.type === "firewall" ? 30 : 20,
});

// Helper function to create a draft-compatible edge
const createEnhancedEdge = (edge: WritableDraft<Edge>): Edge => ({
  ...edge,
  color: getEdgeColor(edge.type),
  width: edge.type === "trunk" ? 3 : 2,
  dashes: edge.type === "wireless",
});

const getNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    router: "#FF6D00",
    firewall: "#D50000",
    switch: "#2962FF",
    accesspoint: "#00C853",
    server: "#AA00FF",
    user: "#616161",
    internet: "#00B8D4",
    default: "#78909C",
  };
  return colors[type.toLowerCase()] || colors.default;
};

const getEdgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    trunk: "#000000",
    lan: "#2962FF",
    wan: "#FF6D00",
    wireless: "#00C853",
    default: "#78909C",
  };
  return colors[type.toLowerCase()] || colors.default;
};

// Thunks
export const generateTopology = createAsyncThunk<
  Topology,
  string,
  { rejectValue: string }
>("topology/generate", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.post(`/topology/${designId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to generate topology"
    );
  }
});

export const getTopology = createAsyncThunk<
  Topology,
  string,
  { rejectValue: string }
>("topology/fetch", async (designId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/topology/${designId}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to fetch topology"
    );
  }
});

export const updateTopology = createAsyncThunk<
  Topology,
  { designId: string; updates: Partial<Topology> },
  { rejectValue: string }
>("topology/update", async ({ designId, updates }, { rejectWithValue }) => {
  try {
    const response = await axios.patch(`/topology/${designId}`, updates);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.error || "Failed to update topology"
    );
  }
});

const topologySlice = createSlice({
  name: "topology",
  initialState,
  reducers: {
    resetTopologyState: () => initialState,
    clearTopologyError: (state) => {
      state.error = null;
    },
    updateNodesAndEdges: (
      state,
      action: PayloadAction<{
        nodes?: Node[];
        edges?: Edge[];
      }>
    ) => {
      if (state.currentTopology) {
        if (action.payload.nodes) {
          state.currentTopology.nodes = action.payload.nodes;
        }
        if (action.payload.edges) {
          state.currentTopology.edges = action.payload.edges;
        }
        state.lastUpdated = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateTopology.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateTopology.fulfilled, (state, action) => {
        state.generating = false;
        state.currentTopology = {
          ...action.payload,
          nodes: action.payload.nodes.map((node) => createEnhancedNode(node)),
          edges: action.payload.edges.map((edge) => createEnhancedEdge(edge)),
        };
        state.lastUpdated = Date.now();
      })
      .addCase(generateTopology.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload || "Failed to generate topology";
      })

      .addCase(getTopology.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTopology.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTopology = {
          ...action.payload,
          nodes: action.payload.nodes.map((node) => createEnhancedNode(node)),
          edges: action.payload.edges.map((edge) => createEnhancedEdge(edge)),
        };
        state.lastUpdated = Date.now();
      })
      .addCase(getTopology.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch topology";
      })

      .addCase(updateTopology.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTopology.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTopology = {
          ...action.payload,
          nodes: action.payload.nodes.map((node) => createEnhancedNode(node)),
          edges: action.payload.edges.map((edge) => createEnhancedEdge(edge)),
        };
        state.lastUpdated = Date.now();
      })
      .addCase(updateTopology.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update topology";
      });
  },
});

export const { resetTopologyState, clearTopologyError, updateNodesAndEdges } =
  topologySlice.actions;

export const selectTopology = (state: RootState) => state.topology;

export const selectVisualizationData = (state: RootState) => {
  const { currentTopology } = state.topology;
  if (!currentTopology) return null;

  return {
    nodes: currentTopology.nodes,
    edges: currentTopology.edges,
    title: currentTopology.title,
    description: currentTopology.description,
  };
};

export default topologySlice.reducer;
