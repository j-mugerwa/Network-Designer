import React, { useState, useMemo } from "react";
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
  Tooltip,
  InputAdornment,
  Skeleton,
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
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  selectAllTemplates,
  selectTemplateLoading,
  selectTemplateError,
  deleteConfigurationTemplate,
  downloadConfigurationFile,
} from "@/store/slices/configurationSlice";
import { ConfigurationTemplate } from "@/types/configuration";
import { useTheme } from "@mui/material/styles";

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

  if (!router.isReady || loading) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={72} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  // Memoized data calculations
  const { filteredConfigs, paginatedConfigs, tableRows } = useMemo(() => {
    // Filter configurations based on search term
    const filtered = templates.filter((config) =>
      config.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginate the filtered results
    const paginated = filtered.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    // Create memoized table rows
    const rows = paginated.map((config, index) => (
      <TableRow
        key={config._id}
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
            ? new Date(config.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A"}
        </TableCell>
        <TableCell>
          {config.deployments?.some((d) => d.status === "active") ? (
            <Chip
              icon={<CheckCircle fontSize="small" />}
              label="Deployed"
              color="success"
              size="small"
              variant="outlined"
            />
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
                onClick={() => router.push(`/configs/${config._id}`)}
                size="small"
                color="info"
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => router.push(`/configs/${config._id}?edit=true`)}
                size="small"
                color="primary"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={async () => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this configuration?"
                    )
                  ) {
                    try {
                      await dispatch(
                        deleteConfigurationTemplate(config._id)
                      ).unwrap();
                    } catch (error) {
                      console.error("Failed to delete configuration:", error);
                    }
                  }
                }}
                size="small"
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Link to device">
              <IconButton
                onClick={() =>
                  router.push(`/deploy-configuration?templateId=${config._id}`)
                }
                size="small"
                color="success"
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download configuration">
              <IconButton
                onClick={() => dispatch(downloadConfigurationFile(config._id))}
                size="small"
                color="secondary"
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    ));

    return {
      filteredConfigs: filtered,
      paginatedConfigs: paginated,
      tableRows: rows,
    };
  }, [templates, searchTerm, page, rowsPerPage, dispatch, router]);

  // Loading and error states
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
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[3] }}>
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
    </Paper>
  );
});

export default ConfigurationsList;
