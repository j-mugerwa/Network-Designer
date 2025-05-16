// src/components/features/home/HeroSection.tsx
import { Box, Typography, Button, Container } from "@mui/material";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export const HeroSection = ({ isAuthenticated }: HeroSectionProps) => (
  <Box
    sx={{
      bgcolor: "secondary.main",
      color: "white",
      py: 8,
      textAlign: "center",
    }}
  >
    <Container maxWidth="md">
      <Typography variant="h2" gutterBottom>
        Network Design Made Simple
      </Typography>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Create, visualize, and optimize your network infrastructure with our
        powerful tools
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        href={isAuthenticated ? "/dashboard" : "/signup"}
      >
        {isAuthenticated ? "Go to Dashboard" : "Get Started"}
      </Button>
    </Container>
  </Box>
);
