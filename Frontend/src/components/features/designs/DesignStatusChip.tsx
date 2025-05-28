// src/components/features/network-design/DesignStatusChip.tsx
import { Chip } from "@mui/material";
import { DesignStatus } from "@/types/networkDesign";

interface DesignStatusChipProps {
  status: DesignStatus;
}

export const DesignStatusChip: React.FC<DesignStatusChipProps> = ({
  status,
}) => {
  const getColor = () => {
    switch (status) {
      case "active":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      case "template":
        return "info";
      default:
        return "primary";
    }
  };

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      color={getColor()}
      size="small"
    />
  );
};
