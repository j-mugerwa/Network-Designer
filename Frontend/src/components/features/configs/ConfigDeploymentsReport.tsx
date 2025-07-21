import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchConfigDeployments } from "@/store/slices/configurationSlice";
import { Deployment, DeploymentStatus } from "@/types/configuration";
import DeploymentDetailsModal from "./DeploymentDetailsModal";

const statusColors: Record<
  DeploymentStatus,
  "error" | "warning" | "success" | "info"
> = {
  pending: "warning",
  active: "success",
  failed: "error",
  "rolled-back": "info",
};

const ConfigDeploymentsReport = () => {
  const dispatch = useAppDispatch();
  const { configDeployments, loading, error, pagination } = useAppSelector(
    (state) => state.configuration.deploymentReports
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [initialized, setInitialized] = useState(false);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        await dispatch(
          fetchConfigDeployments({
            page: page + 1,
            limit: rowsPerPage,
            signal: controller.signal,
          })
        ).unwrap();
        if (isMounted) setInitialized(true);
      } catch (error) {
        if (isMounted) setInitialized(true);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [dispatch, page, rowsPerPage]);

  const handleRefresh = () => {
    dispatch(fetchConfigDeployments({ page: page + 1, limit: rowsPerPage }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDeployment(null);
  };

  if (!initialized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <IconButton onClick={handleRefresh} sx={{ ml: 1 }}>
          <RefreshIcon />
        </IconButton>
      </Alert>
    );
  }

  if (configDeployments.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No deployments found
        <IconButton onClick={handleRefresh} sx={{ ml: 1 }}>
          <RefreshIcon />
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Configuration Deployment Report</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Configuration</TableCell>
                <TableCell>Vendor/Model</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Deployments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configDeployments.map((config) => (
                <TableRow key={config._id}>
                  <TableCell>
                    <Typography fontWeight="medium">{config.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      v{config.version}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {config.vendor} {config.model}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={config.configType}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{config.createdBy?.name || "System"}</TableCell>
                  <TableCell>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          {config.deploymentCount} deployment(s)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Device</TableCell>
                              <TableCell>Deployed By</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {config.deployments?.map((deployment) => (
                              <TableRow
                                key={deployment._id}
                                hover
                                onClick={() => handleRowClick(deployment)}
                                sx={{ cursor: "pointer" }}
                              >
                                <TableCell>
                                  {typeof deployment.device === "string"
                                    ? deployment.device
                                    : deployment.device?.model || "Unknown"}
                                </TableCell>
                                <TableCell>
                                  {typeof deployment.deployedBy === "string"
                                    ? deployment.deployedBy
                                    : deployment.deployedBy?.name || "System"}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    deployment.deployedAt
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={deployment.status}
                                    color={statusColors[deployment.status]}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={pagination.totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </TableContainer>
      </Paper>

      {/* Deployment Details Modal */}
      <DeploymentDetailsModal
        open={isModalOpen}
        onClose={handleCloseModal}
        deployment={selectedDeployment}
      />
    </Box>
  );
};

export default ConfigDeploymentsReport;
