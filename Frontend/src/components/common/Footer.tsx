import React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: "center",
        py: 2,
        bgcolor: "grey.200",
        width: "100%",
        mt: "auto", // Pushes it to the bottom
      }}
    >
      <Typography variant="subtitle1">Network Designs That Work</Typography>
    </Box>
  );
};

export default Footer;
