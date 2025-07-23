import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertColor,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  Add,
  Link as LinkIcon,
  Search,
  CheckCircle,
  Cancel,
  Download,
  MoreVert,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  selectAllTemplates,
  selectTemplateLoading,
  selectTemplateError,
  deleteConfigurationTemplate,
  downloadConfigurationFile,
  clearConfigurationError,
  fetchAllTemplates,
} from "@/store/slices/configurationSlice";
import { ConfigurationTemplate } from "@/types/configuration";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const ConfigurationsList = React.memo(() => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useTheme();

  // Redux state
  const loading = useAppSelector(selectTemplateLoading);
  const error = useAppSelector(selectTemplateError);
  const templates = useAppSelector(selectAllTemplates);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConfig, setSelectedConfig] =
    useState<ConfigurationTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snackbar state with proper typing
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Reset error state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearConfigurationError());
    };
  }, [dispatch]);

  // To handle download errors
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: "error",
      });
    }
  }, [error]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    config: ConfigurationTemplate
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedConfig(config);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (config: ConfigurationTemplate) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Close the menu
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConfig) return;

    const configId = selectedConfig._id || selectedConfig.id;
    if (!configId) {
      console.error("No valid ID found for configuration to delete");
      setSnackbar({
        open: true,
        message: "No valid configuration ID found",
        severity: "error",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteConfigurationTemplate(configId)).unwrap();

      setSnackbar({
        open: true,
        message: "Configuration deleted successfully",
        severity: "success",
      });

      // Refresh the list
      await dispatch(fetchAllTemplates());
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete configuration";
      console.error("Failed to delete configuration:", errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedConfig(null);
    }
  };

  const getConfigId = (
    config: ConfigurationTemplate | null
  ): string | undefined => {
    if (!config) return undefined;
    return config._id || config.id;
  };

  // Memoized data calculations
  const { filteredConfigs, paginatedConfigs, tableRows } = useMemo(() => {
    const filtered = templates.filter(
      (config) =>
        config.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.configType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginated = filtered.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    const rows = paginated
      .map((config, index) => {
        const configId = getConfigId(config);
        if (!configId) {
          console.error("Configuration missing ID:", config);
          return null;
        }

        return (
          <TableRow
            key={configId}
            hover
            sx={{ "&:last-child td": { borderBottom: 0 } }}
          >
            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
            <TableCell>
              <Typography fontWeight="medium">{config.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {config.description || "No description"}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={config.configType}
                color="primary"
                size="small"
                variant="outlined"
              />
            </TableCell>
            <TableCell>{config.variables?.length || 0} variables</TableCell>
            <TableCell>
              {typeof config.createdBy === "object" && config.createdBy !== null
                ? config.createdBy.name || config.createdBy.email || "System"
                : "System"}
            </TableCell>
            <TableCell>
              {config.createdAt
                ? format(new Date(config.createdAt), "MMM dd, yyyy")
                : "N/A"}
            </TableCell>
            <TableCell>
              {config.deployments?.some((d) => d.status === "active") ? (
                <Tooltip
                  title={`Active since ${format(
                    new Date(
                      config.deployments.find((d) => d.status === "active")
                        ?.deployedAt || new Date()
                    ),
                    "MMM dd, yyyy"
                  )}`}
                >
                  <Chip
                    icon={<CheckCircle fontSize="small" />}
                    label="Deployed"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              ) : (
                <Chip
                  icon={<Cancel fontSize="small" />}
                  label="Not Deployed"
                  color="error"
                  size="small"
                  variant="outlined"
                />
              )}
            </TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="View details">
                  <IconButton
                    onClick={() => router.push(`/configs/${configId}`)}
                    size="small"
                    color="info"
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More actions">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, config)}
                    size="small"
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        );
      })
      .filter(Boolean);

    return {
      filteredConfigs: filtered,
      paginatedConfigs: paginated,
      tableRows: rows,
    };
  }, [templates, searchTerm, page, rowsPerPage, router]);

  if (!router.isReady || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        onClose={() => dispatch(clearConfigurationError())}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[3] }}>
      {/* ... (rest of your JSX remains the same until the Menu component) ... */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          label="Search configurations"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 300,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/configs/new")}
          startIcon={<Add />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            py: 1,
          }}
        >
          New Configuration
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Variables</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Created By</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.length > 0 ? (
              tableRows
            ) : (
              <TableRow key="empty-state">
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchTerm
                      ? "No configurations match your search"
                      : "No configurations available"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 30]}
        component="div"
        count={filteredConfigs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          "& .MuiTablePagination-toolbar": {
            paddingLeft: 2,
          },
        }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            const configId = getConfigId(selectedConfig);
            if (configId) {
              router.push(`/configs/${configId}?mode=edit`);
            }
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            const configId = getConfigId(selectedConfig);
            if (configId) {
              router.push({
                pathname: `/configs/deploy/${configId}`,
                query: { fromList: true },
              });
            }
            handleMenuClose();
          }}
        >
          <LinkIcon fontSize="small" sx={{ mr: 1 }} /> Deploy
        </MenuItem>

        {/*
        <MenuItem
          onClick={() => {
            const configId = getConfigId(selectedConfig);
            if (configId) {
              dispatch(downloadConfigurationFile(configId));
            }
            handleMenuClose();
          }}
        >
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>
        */}

        <MenuItem
          onClick={() => {
            const configId = getConfigId(selectedConfig);
            if (configId && selectedConfig) {
              dispatch(
                downloadConfigurationFile({
                  templateId: configId,
                  template: selectedConfig,
                })
              )
                .unwrap()
                .catch((error) => {
                  setSnackbar({
                    open: true,
                    message: error || "Failed to download configuration",
                    severity: "error",
                  });
                });
            }
            handleMenuClose();
          }}
        >
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>

        <MenuItem
          onClick={() => selectedConfig && handleDeleteClick(selectedConfig)}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} color="error" /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the configuration "
            {selectedConfig?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
});

ConfigurationsList.displayName = "ConfigurationsList";

export default ConfigurationsList;
