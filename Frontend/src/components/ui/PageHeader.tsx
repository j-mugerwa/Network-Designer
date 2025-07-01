// src/components/ui/PageHeader.tsx
import { Typography, Box } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => (
  <Box mb={4}>
    <Typography variant="h4" component="h1" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="subtitle1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);
