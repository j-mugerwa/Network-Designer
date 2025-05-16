// src/components/features/home/PlansSection/PlanCard.tsx
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { FC } from "react";

interface PlanFeature {
  key: string;
  value: any;
}

interface PlanCardProps {
  plan: {
    _id: string;
    name: string;
    price: number;
    description?: string;
    features?: Record<string, any>;
  };
}

export const PlanCard: FC<PlanCardProps> = ({ plan }) => {
  const formatFeatureName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace("Api", "API");
  };

  const renderFeatureValue = (value: any) => {
    if (value === true) return "✓";
    if (value === false) return "✗";
    if (Array.isArray(value)) return value.join(", ");
    return value;
  };

  const features: PlanFeature[] = plan.features
    ? Object.entries(plan.features).map(([key, value]) => ({ key, value }))
    : [];

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1,
        borderRadius: 1,
        boxShadow: 1,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {plan.name}
        </Typography>

        <Typography
          variant="h4"
          color="primary"
          gutterBottom
          sx={{ fontWeight: 800 }}
        >
          ${plan.price}
          <Typography
            component="span"
            color="text.secondary"
            sx={{ fontSize: "1rem", ml: 0.5 }}
          >
            /month
          </Typography>
        </Typography>

        {plan.description && (
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            {plan.description}
          </Typography>
        )}

        {features.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Key Features:
            </Typography>
            <List dense disablePadding>
              {features.map(({ key, value }) => (
                <ListItem key={key} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={`${formatFeatureName(key)} : ${renderFeatureValue(
                      value
                    )}`}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          href={`/signup?plan=${plan._id}`}
          sx={{ fontWeight: 600 }}
        >
          Get Started
        </Button>
      </Box>
    </Card>
  );
};
