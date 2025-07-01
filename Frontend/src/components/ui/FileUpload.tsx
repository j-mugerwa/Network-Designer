// src/components/ui/FileUpload.tsx
import { Button, Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface FileUploadProps {
  onChange: (file: File | null) => void;
  accept?: string;
}

export const FileUpload = ({ onChange, accept }: FileUploadProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] || null);
  };

  return (
    <Box>
      <input
        accept={accept}
        style={{ display: "none" }}
        id="file-upload"
        type="file"
        onChange={handleChange}
      />
      <label htmlFor="file-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
        >
          Upload File
        </Button>
      </label>
    </Box>
  );
};
