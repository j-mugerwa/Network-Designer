// components/layout/GridItem.tsx
import { Box, SxProps, Theme } from "@mui/material";
import React from "react";

interface GridItemProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const GridItem: React.FC<GridItemProps> = ({ children, sx = {} }) => (
  <Box sx={{ display: "flex", ...sx }}>{children}</Box>
);
