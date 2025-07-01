// src/theme.ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", //primary color
    },
    secondary: {
      main: "#dc004e", //secondary color
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Buttons without uppercase
        },
      },
    },
    // Other component customizations
  },
});
