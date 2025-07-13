// src/components/features/equipment/EquipmentTable.tsx
import Link from "next/link";
import { Equipment } from "@/types/equipment";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { deleteEquipmentItem } from "@/store/slices/equipmentSlice";
import { useState } from "react";
import { AppDispatch } from "@/store/store";

interface EquipmentTableProps {
  equipment: Equipment[];
  loading?: boolean;
  onDeleteSuccess?: () => void;
}

const EquipmentTable = ({
  equipment,
  loading = false,
  onDeleteSuccess,
}: EquipmentTableProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(
    null
  );

  const handleDeleteClick = (id: string) => {
    setEquipmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (equipmentToDelete) {
      try {
        await dispatch(deleteEquipmentItem(equipmentToDelete)).unwrap();
        onDeleteSuccess?.();
      } catch (error) {
        console.error("Failed to delete equipment:", error);
      } finally {
        setDeleteDialogOpen(false);
        setEquipmentToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setEquipmentToDelete(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (equipment.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No equipment found. Start by adding some devices.
        </Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href="/devices/create"
          >
            Add New Equipment
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Specifications</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {item.imageUrl && (
                      <Avatar
                        src={item.imageUrl}
                        alt={item.model}
                        sx={{ mr: 2, width: 56, height: 56 }}
                        variant="rounded"
                      />
                    )}
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {item.model}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.priceRange}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography>{item.manufacturer}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.category}
                    color="primary"
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>
                  {item.specs.ports && (
                    <Typography variant="body2">
                      <Box component="span" fontWeight="bold">
                        Ports:
                      </Box>{" "}
                      {item.specs.ports}
                    </Typography>
                  )}
                  {item.specs.portSpeed && (
                    <Typography variant="body2">
                      <Box component="span" fontWeight="bold">
                        Speed:
                      </Box>{" "}
                      {item.specs.portSpeed}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      component={Link}
                      href={`/devices/edit/${item.id}`}
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(item.id)}
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this equipment? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EquipmentTable;
