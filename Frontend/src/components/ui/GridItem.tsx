import { Grid, GridProps } from "@mui/material";
import React from "react";

interface GridItemProps extends Omit<GridProps, "container"> {
  children: React.ReactNode;
}

export const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => (
  <Grid item {...props}>
    {children}
  </Grid>
);
