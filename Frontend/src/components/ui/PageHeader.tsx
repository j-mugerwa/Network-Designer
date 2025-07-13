// src/components/ui/PageHeader.tsx
import { Typography, Box, Breadcrumbs, Link } from "@mui/material";
import NextLink from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
}: PageHeaderProps) => (
  <Box mb={4}>
    {/* Breadcrumbs */}
    {breadcrumbs && breadcrumbs.length > 0 && (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        {breadcrumbs.map((item, index) =>
          item.href ? (
            <Link
              key={index}
              component={NextLink}
              href={item.href}
              color="inherit"
              underline="hover"
            >
              {item.label}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    )}

    {/* Title */}
    <Typography variant="h4" component="h1" gutterBottom>
      {title}
    </Typography>

    {/* Subtitle */}
    {subtitle && (
      <Typography variant="subtitle1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);
