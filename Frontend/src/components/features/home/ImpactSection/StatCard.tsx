// src/components/features/home/ImpactSection/StatCard.tsx
import { Card, CardContent, Typography } from "@mui/material";
import { FC } from "react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
}

export const StatCard: FC<StatCardProps> = ({ title, value, description }) => (
  <Card
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      textAlign: "center",
      p: 2,
      borderRadius: 2,
      boxShadow: 2,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: 6,
      },
    }}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
        {value.toLocaleString()}+
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);
