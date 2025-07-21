import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Paper,
  Tab,
  Tabs,
  TextField,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Deployment } from "@/types/configuration";
import { GridItem } from "@/components/layout/GridItem";
import { isPopulatedEquipment, isPopulatedUser } from "@/types/configuration";

const DeploymentDetailsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  deployment: Deployment | null;
}> = ({ open, onClose, deployment }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  if (!deployment) return null;

  // Helper function to get device info
  const getDeviceInfo = () => {
    if (!deployment.device) return { model: "N/A", ipAddress: "N/A" };
    if (isPopulatedEquipment(deployment.device)) {
      return {
        model: deployment.device.model,
        ipAddress: deployment.device.ipAddress || "N/A",
      };
    }
    return { model: "N/A", ipAddress: "N/A" };
  };

  // Helper function to get deployed by info
  const getDeployedByInfo = () => {
    if (!deployment.deployedBy) return "N/A";
    if (isPopulatedUser(deployment.deployedBy)) {
      return deployment.deployedBy.name || "N/A";
    }
    return "N/A";
  };

  // Improved template info function

  const getTemplateInfo = () => {
    // First check if template exists and is populated
    if (deployment.template && typeof deployment.template === "object") {
      return {
        name: deployment.template.name || "N/A",
        version: deployment.template.version || "N/A",
        configType: deployment.template.configType || "N/A",
        vendor: deployment.template.vendor || "N/A",
        model: deployment.template.model || "N/A",
      };
    }

    // If template is not available, check for direct properties on deployment
    return {
      name: deployment.name || "N/A",
      version: deployment.version || "N/A",
      configType: deployment.configType || "N/A",
      vendor: deployment.vendor || "N/A",
      model: deployment.model || "N/A",
    };
  };

  // Status colors
  const getStatusColor = () => {
    switch (deployment.status) {
      case "active":
        return "success" as const;
      case "failed":
        return "error" as const;
      case "pending":
        return "warning" as const;
      case "rolled-back":
        return "info" as const;
      default:
        return "default" as const;
    }
  };

  const deviceInfo = getDeviceInfo();
  const deployedByName = getDeployedByInfo();
  const templateInfo = getTemplateInfo();
  const statusColor = getStatusColor();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Deployment Details
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {new Date(deployment.deployedAt).toLocaleString()}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {/*
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <GridItem sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Configuration Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Name" secondary={templateInfo.name} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Version"
                  secondary={
                    templateInfo.version ? `v${templateInfo.version}` : "N/A"
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Type"
                  secondary={
                    templateInfo.configType !== "N/A" ? (
                      <Chip label={templateInfo.configType} size="small" />
                    ) : (
                      "N/A"
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Vendor/Model"
                  secondary={
                    `${templateInfo.vendor} ${templateInfo.model}`.trim() ||
                    "N/A"
                  }
                />
              </ListItem>
            </List>
          </GridItem>

          <GridItem sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Device Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Device Model"
                  secondary={deviceInfo.model}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="IP Address"
                  secondary={deviceInfo.ipAddress}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={deployment.status}
                      color={statusColor}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Deployed By"
                  secondary={deployedByName}
                />
              </ListItem>
            </List>
          </GridItem>
        </Box>
        */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <GridItem sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Configuration Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Name" secondary={templateInfo.name} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Version"
                  secondary={
                    templateInfo.version ? `v${templateInfo.version}` : "N/A"
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Type"
                  secondary={
                    templateInfo.configType !== "N/A" ? (
                      <Chip label={templateInfo.configType} size="small" />
                    ) : (
                      "N/A"
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Vendor/Model"
                  secondary={
                    `${templateInfo.vendor} ${templateInfo.model}`.trim() ||
                    "N/A"
                  }
                />
              </ListItem>
            </List>
          </GridItem>

          <GridItem sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Device Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Device Model"
                  secondary={deviceInfo.model}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="IP Address"
                  secondary={deviceInfo.ipAddress}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={deployment.status}
                      color={statusColor}
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Deployed By"
                  secondary={deployedByName}
                />
              </ListItem>
            </List>
          </GridItem>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Variables" />
          <Tab label="Rendered Config" />
          <Tab label="Notes" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {Object.entries(deployment.variables || {}).map(([key, value]) => (
              <GridItem
                key={key}
                sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}
              >
                <TextField
                  label={key}
                  value={value}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </GridItem>
            ))}
          </Box>
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 2, bgcolor: "background.default" }}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {deployment.renderedConfig}
            </pre>
          </Paper>
        )}

        {activeTab === 2 && (
          <TextField
            label="Deployment Notes"
            value={deployment.notes || "No notes provided"}
            multiline
            rows={4}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeploymentDetailsModal;
