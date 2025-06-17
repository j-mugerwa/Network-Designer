// src/components/features/topology/TopologyVisualizer.tsx
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  generateTopology,
  getTopology,
  selectTopology,
} from "@/store/slices/networkTopologySlice";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { DataSet } from "vis-data";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.css";

export const TopologyVisualizer = ({ designId }: { designId: string }) => {
  const dispatch = useAppDispatch();
  const { currentTopology, loading, error } = useAppSelector(selectTopology);
  const [initialLoad, setInitialLoad] = useState(true);
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);

  // Fetch topology when designId changes
  useEffect(() => {
    if (designId) {
      dispatch(getTopology(designId));
      setInitialLoad(false);
    }
  }, [designId, dispatch]);

  // Initialize or update visualization
  useEffect(() => {
    if (!currentTopology || !networkRef.current) return;

    // Destroy previous instance if exists
    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    // Prepare nodes and edges for visualization
    const nodes = new DataSet(
      currentTopology.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        group: node.type,
        level: node.level,
        title: `
          Type: ${node.type}
          ${node.model ? `Model: ${node.model}` : ""}
          ${node.vlan ? `VLAN: ${node.vlan}` : ""}
        `,
      }))
    );

    const edges = new DataSet(
      currentTopology.edges.map((edge, index) => ({
        id: index.toString(),
        from: edge.from,
        to: edge.to,
        label: edge.label,
        title: `Bandwidth: ${edge.bandwidth}\nType: ${edge.type}`,
      }))
    );

    // Create network visualization
    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      {
        layout: {
          hierarchical: {
            direction: "UD",
            nodeSpacing: 150,
            levelSeparation: 200,
          },
        },
        nodes: {
          shape: "box",
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          widthConstraint: { maximum: 150 },
          font: { size: 12 },
        },
        edges: {
          smooth: true,
          arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        },
      }
    );

    return () => {
      networkInstance.current?.destroy();
    };
  }, [currentTopology]);

  const handleRegenerate = () => {
    if (designId) {
      dispatch(generateTopology(designId));
    }
  };

  if (initialLoad) return null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleRegenerate} disabled={loading}>
          Regenerate Topology
        </Button>
      </Box>
    );
  }

  if (!currentTopology) {
    return (
      <Box p={2}>
        <Typography>No topology data available</Typography>
        <Button onClick={handleRegenerate} disabled={loading}>
          Generate Topology
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "600px", border: "1px solid #eee", borderRadius: 1 }}>
      <div ref={networkRef} style={{ height: "100%", width: "100%" }} />
    </Box>
  );
};
