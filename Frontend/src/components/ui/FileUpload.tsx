// src/components/ui/FileUpload.tsx
import { Button, Box, Typography, Alert } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useState } from "react";

interface FileUploadProps {
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // Add maxSize to the interface
}

export const FileUpload = ({ onChange, accept, maxSize }: FileUploadProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && maxSize && file.size > maxSize) {
      setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      onChange(null);
      // Clear the input value so user can reselect the same file
      e.target.value = "";
    } else {
      setError(null);
      onChange(file);
    }
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
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
