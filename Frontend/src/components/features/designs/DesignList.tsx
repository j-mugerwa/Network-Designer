// src/components/features/network-design/DesignList.tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useEffect, useState } from "react";
import {
  archiveDesign,
  fetchUserDesigns,
  setCurrentDesign,
} from "@/store/slices/networkDesignSlice";
import { GridItem } from "@/components/layout/GridItem";
import { useRouter } from "next/router";
import { DesignStatusChip } from "./DesignStatusChip";

export const DesignList = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    designs,
    loading,
    error,
    pagination: { page, pages, total },
  } = useAppSelector((state) => state.designs);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUserDesigns({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handlePageChange = (_: any, newPage: number) => {
    dispatch(fetchUserDesigns({ page: newPage, limit: 10 }));
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    designId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDesignId(designId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDesignId(null);
  };

  const handleViewDesign = (designId: string) => {
    router.push(`/designs/${designId}`);
    handleMenuClose();
  };

  const handleArchiveDesign = async () => {
    if (selectedDesignId) {
      await dispatch(archiveDesign(selectedDesignId));
      handleMenuClose();
    }
  };

  if (loading && designs.length === 0) {
    return (
      <GridItem>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </GridItem>
    );
  }

  if (error) {
    return (
      <GridItem>
        <Card>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      </GridItem>
    );
  }

  return (
    <GridItem>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">My Network Designs</Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/designs/new")}
            >
              New Design
            </Button>
          </Box>

          {designs.length === 0 ? (
            <Typography>No designs found. Create your first design!</Typography>
          ) : (
            <>
              {/* Replace Grid with Box using CSS Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {designs.map((design) => (
                  <Box key={design.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Typography variant="subtitle1">
                            {design.designName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, design.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {design.description || "No description"}
                        </Typography>
                        <Box mt={1} display="flex" alignItems="center">
                          <DesignStatusChip status={design.designStatus} />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            ml={1}
                          >
                            v{design.version}
                          </Typography>
                        </Box>
                        <Typography variant="caption" display="block">
                          {new Date(design.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>

              <Box mt={4} display="flex" justifyContent="center">
                <Pagination
                  count={pages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() =>
                selectedDesignId && handleViewDesign(selectedDesignId)
              }
            >
              View
            </MenuItem>
            <MenuItem onClick={handleArchiveDesign}>Archive</MenuItem>
          </Menu>
        </CardContent>
      </Card>
    </GridItem>
  );
};
