// components/layout/ResponsiveGrid.tsx
import { Box, SxProps, Theme } from "@mui/material";
import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  sx?: SxProps<Theme>;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 4 },
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: `repeat(${columns.xs || 1}, 1fr)`,
          sm: `repeat(${columns.sm || 2}, 1fr)`,
          md: `repeat(${columns.md || 3}, 1fr)`,
          lg: `repeat(${columns.lg || 4}, 1fr)`,
          xl: `repeat(${columns.xl || 4}, 1fr)`,
        },
        gap: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
