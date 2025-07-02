import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "@/store/store";
import {
  fetchUserEquipment,
  assignEquipmentToDesign,
  removeEquipmentFromDesign,
  fetchDesignEquipment,
} from "@/store/slices/equipmentSlice";
import { fetchUserDesigns } from "@/store/slices/networkDesignSlice";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  IconButton,
  Stack,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Devices as DeviceIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { GridItem } from "@/components/layout/GridItem";
import { SelectChangeEvent } from "@mui/material/Select";

interface SelectedDevice {
  id: string;
  quantity: number;
}

const DeviceAssignment = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get state from Redux
  const {
    userEquipment,
    loading,
    error,
    designEquipment,
    assigningToDesign,
    removingFromDesign,
  } = useSelector((state: RootState) => state.equipment);
  const { designs } = useSelector((state: RootState) => state.designs);

  // Local state
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [tempAssignedDevices, setTempAssignedDevices] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchUserEquipment());
    dispatch(fetchUserDesigns({}));
  }, [dispatch]);

  // When design changes, fetch its equipment
  useEffect(() => {
    if (selectedDesignId) {
      dispatch(fetchDesignEquipment(selectedDesignId));
    }
  }, [selectedDesignId, dispatch]);

  // Update temp assigned devices when design equipment changes
  useEffect(() => {
    if (designEquipment && selectedDesignId) {
      setTempAssignedDevices(designEquipment.map((device) => device.id));
    }
  }, [designEquipment, selectedDesignId]);

  // Filter out already assigned devices and apply search filter
  const availableDevices = useMemo(() => {
    const filtered = userEquipment.filter(
      (device) => !tempAssignedDevices.includes(device.id)
    );

    if (!searchTerm) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter(
      (device) =>
        device.model?.toLowerCase().includes(term) ||
        device.manufacturer?.toLowerCase().includes(term) ||
        device.category?.toLowerCase().includes(term)
      //device.serialNumber?.toLowerCase().includes(term)
    );
  }, [userEquipment, tempAssignedDevices, searchTerm]);

  // Handle design selection
  const handleDesignChange = (event: SelectChangeEvent<string>) => {
    setSelectedDesignId(event.target.value);
    setSelectedDevices([]);
  };

  // Handle device selection and quantity
  const handleDeviceToggle = (deviceId: string) => {
    const existingDeviceIndex = selectedDevices.findIndex(
      (device) => device.id === deviceId
    );

    if (existingDeviceIndex >= 0) {
      // Remove device if already selected
      const newSelected = [...selectedDevices];
      newSelected.splice(existingDeviceIndex, 1);
      setSelectedDevices(newSelected);
    } else {
      // Add device with default quantity of 1
      setSelectedDevices([...selectedDevices, { id: deviceId, quantity: 1 }]);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (deviceId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setSelectedDevices(
      selectedDevices.map((device) =>
        device.id === deviceId ? { ...device, quantity: newQuantity } : device
      )
    );
  };

  // Handle device assignment
  const handleAssignDevices = async () => {
    if (!selectedDesignId || selectedDevices.length === 0) return;

    try {
      // Prepare equipment with quantities
      const equipmentWithQuantities = selectedDevices.map((device) => ({
        equipmentId: device.id,
        quantity: device.quantity,
      }));

      await dispatch(
        assignEquipmentToDesign({
          designId: selectedDesignId,
          equipment: equipmentWithQuantities,
        })
      ).unwrap();

      setSnackbarMessage("Devices assigned successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSelectedDevices([]);
      dispatch(fetchDesignEquipment(selectedDesignId));
    } catch (error) {
      setSnackbarMessage(
        "Failed to assign devices: " + (error as Error).message
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handle device removal
  const handleRemoveDevice = async (deviceId: string) => {
    if (!selectedDesignId) return;

    try {
      await dispatch(
        removeEquipmentFromDesign({
          designId: selectedDesignId,
          equipmentIds: [deviceId],
        })
      ).unwrap();

      setSnackbarMessage("Device removed successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      dispatch(fetchDesignEquipment(selectedDesignId));
    } catch (error) {
      setSnackbarMessage(
        "Failed to remove device: " + (error as Error).message
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Check if a device is selected
  const isDeviceSelected = (deviceId: string) => {
    return selectedDevices.some((device) => device.id === deviceId);
  };

  // Get quantity for a selected device
  const getDeviceQuantity = (deviceId: string) => {
    const device = selectedDevices.find((d) => d.id === deviceId);
    return device ? device.quantity : 1;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Design Selection */}
        <GridItem sx={{ width: { xs: "100%", md: "calc(50% - 12px)" } }}>
          <Card
            sx={{ border: selectedDesignId ? "2px solid #1976d2" : undefined }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Design
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel id="design-select-label">Design</InputLabel>
                <Select
                  labelId="design-select-label"
                  id="design-select"
                  value={selectedDesignId}
                  label="Design"
                  onChange={handleDesignChange}
                  disabled={loading}
                >
                  {designs.map((design) => (
                    <MenuItem key={design.id} value={design.id}>
                      {design.designName} ({design.version})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDesignId && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Currently assigned devices ({designEquipment.length}):
                  </Typography>
                  {designEquipment.length > 0 ? (
                    <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                      {designEquipment.map((device) => (
                        <ListItem
                          key={device.id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleRemoveDevice(device.id)}
                              disabled={removingFromDesign}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                          sx={{ borderBottom: "1px solid rgba(0,0,0,0.12)" }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Chip
                                  label={`x${device.quantity || 1}`}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                {device.model || "Unknown Model"}
                              </Box>
                            }
                            secondary={`${device.manufacturer || "Unknown"} - ${
                              device.category || "Unknown"
                            }`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No devices assigned to this design yet.
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>

        {/* Device Selection */}
        <GridItem sx={{ width: { xs: "100%", md: "calc(50% - 12px)" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Devices
              </Typography>

              {/* Search field */}
              <TextField
                fullWidth
                placeholder="Search devices by model, manufacturer, or category..."
                margin="normal"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <>
                  {availableDevices.length > 0 ? (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Showing {availableDevices.length} available devices
                      </Typography>
                      <List dense sx={{ maxHeight: 400, overflow: "auto" }}>
                        {availableDevices.map((device) => (
                          <Box
                            key={device.id}
                            sx={{
                              backgroundColor: isDeviceSelected(device.id)
                                ? "rgba(25, 118, 210, 0.08)"
                                : undefined,
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          >
                            <ListItem disablePadding>
                              <ListItemButton
                                role={undefined}
                                onClick={() => handleDeviceToggle(device.id)}
                                dense
                              >
                                <ListItemIcon>
                                  <Checkbox
                                    edge="start"
                                    checked={isDeviceSelected(device.id)}
                                    tabIndex={-1}
                                    disableRipple
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={device.model}
                                  secondary={`${device.manufacturer} - ${device.category}`}
                                />
                              </ListItemButton>
                            </ListItem>

                            {isDeviceSelected(device.id) && (
                              <Box sx={{ pl: 9, pr: 2, pb: 1 }}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ width: 150 }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleQuantityChange(
                                        device.id,
                                        getDeviceQuantity(device.id) - 1
                                      )
                                    }
                                    disabled={getDeviceQuantity(device.id) <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={getDeviceQuantity(device.id)}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        device.id,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    inputProps={{
                                      min: 1,
                                      style: { textAlign: "center" },
                                    }}
                                    sx={{ flex: 1 }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleQuantityChange(
                                        device.id,
                                        getDeviceQuantity(device.id) + 1
                                      )
                                    }
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </List>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm
                        ? "No devices match your search criteria."
                        : selectedDesignId
                        ? "All your devices are already assigned to this design."
                        : "No devices available. Please create devices first."}
                    </Typography>
                  )}

                  {selectedDevices.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Divider />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 2,
                        }}
                      >
                        <Typography variant="subtitle1">
                          Selected: {selectedDevices.length} device(s)
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleAssignDevices}
                          disabled={!selectedDesignId || assigningToDesign}
                          startIcon={<DeviceIcon />}
                        >
                          {assigningToDesign ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Assign to Design"
                          )}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeviceAssignment;
