// src/components/features/designs/DesignSelector.tsx
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  FormHelperText,
  Box,
  Typography,
} from "@mui/material";
import type { NetworkDesignUI } from "@/types/networkDesign";

interface DesignSelectorProps {
  designs: NetworkDesignUI[];
  selectedDesignId: string | null;
  onSelectDesign: (designId: string | null) => void;
  className?: string;
  helperText?: string;
}

const DesignSelector = ({
  designs,
  selectedDesignId,
  onSelectDesign,
  className,
  helperText = "Select a network design to view recommendations",
}: DesignSelectorProps) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onSelectDesign(event.target.value || null);
  };

  return (
    <Box
      component="fieldset"
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
        m: 0,
        minWidth: 0,
        "&:hover": {
          borderColor: "text.primary",
        },
        "&:focus-within": {
          borderColor: "primary.main",
          borderWidth: 2,
        },
      }}
    >
      <Typography
        component="legend"
        sx={{
          px: 1,
          color: "text.secondary",
          fontSize: "0.75rem",
          lineHeight: "1.66",
        }}
      >
        Network Design
      </Typography>
      <FormControl
        fullWidth
        variant="outlined"
        className={className}
        sx={{ mt: 0.5 }}
      >
        <Select
          id="design-selector"
          value={selectedDesignId || ""}
          onChange={handleChange}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Typography color="text.disabled">
                  Select a design...
                </Typography>
              );
            }
            const selectedDesign = designs.find((d) => d.id === selected);
            return selectedDesign
              ? `${selectedDesign.designName} - ${selectedDesign.description}`
              : "";
          }}
          sx={{
            "& .MuiSelect-select": {
              py: 1.5,
            },
          }}
        >
          {designs.map((design) => (
            <MenuItem key={design.id} value={design.id}>
              <Box>
                <Typography fontWeight="medium">{design.designName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {design.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <FormHelperText sx={{ mx: 0 }}>{helperText}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default DesignSelector;
