// src/components/features/designs/DesignSelector.tsx
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import type { NetworkDesignUI } from "@/types/networkDesign";

interface DesignSelectorProps {
  designs: NetworkDesignUI[];
  selectedDesignId: string | null;
  onSelectDesign: (designId: string | null) => void;
  className?: string;
}

const DesignSelector = ({
  designs,
  selectedDesignId,
  onSelectDesign,
  className,
}: DesignSelectorProps) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onSelectDesign(event.target.value || null);
  };

  return (
    <FormControl fullWidth className={className}>
      <InputLabel id="design-selector-label">Select a Design</InputLabel>
      <Select
        labelId="design-selector-label"
        id="design-selector"
        value={selectedDesignId || ""}
        onChange={handleChange}
        label="Select a Design"
        displayEmpty
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {designs.map((design) => (
          <MenuItem key={design.id} value={design.id}>
            {design.designName} - {design.description}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DesignSelector;
