import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  Box,
  Skeleton,
} from "@mui/material";
import { GridItem } from "@/components/layout/GridItem";
import { useAppSelector } from "@/store/store";
import { format } from "date-fns";

interface RecentItem {
  _id: string;
  name?: string;
  title?: string;
  designName?: string;
  reportName?: string;
  displayName: string;
  notificationTitle?: string;
  createdAt: string;
}

interface RecentItemsData {
  designs: RecentItem[];
  reports: RecentItem[];
  notifications: RecentItem[];
}

// Mapping of collection types to their name fields
const NAME_FIELD_MAP: Record<keyof RecentItemsData, keyof RecentItem> = {
  designs: "designName",
  reports: "title",
  notifications: "name", // or 'notificationTitle' if different
};

const RecentItems = () => {
  const { recentItems, loading, error } = useAppSelector(
    (state) => state.dashboard
  );

  // Function to get display name for an item based on its category
  const getDisplayName = (
    item: RecentItem,
    category: keyof RecentItemsData
  ): string => {
    const nameField = NAME_FIELD_MAP[category];
    return item[nameField] || "Untitled";
  };

  // Loading state
  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Skeleton variant="text" width="30%" height={40} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {[1, 2, 3].map((item) => (
              <GridItem key={item}>
                <Skeleton variant="text" width="50%" height={30} />
                <Skeleton variant="rectangular" height={200} />
              </GridItem>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error" variant="h6">
            Error loading recent items: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Type guard for recentItems
  const hasRecentItems = (items: any): items is RecentItemsData => {
    return (
      items &&
      "designs" in items &&
      "reports" in items &&
      "notifications" in items
    );
  };

  if (!hasRecentItems(recentItems)) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          <Typography>No recent items data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activities
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {(
            Object.entries(recentItems) as [
              keyof RecentItemsData,
              RecentItem[]
            ][]
          ).map(([category, items]) => (
            <GridItem key={category}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Latest {category.charAt(0).toUpperCase() + category.slice(1)}
                <Link
                  href={`/${category}`}
                  sx={{ float: "right", fontSize: "0.875rem" }}
                >
                  View All
                </Link>
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items && items.length > 0 ? (
                    items.slice(0, 5).map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.displayName}</TableCell>
                        {/*<TableCell>{getDisplayName(item, category)}</TableCell>*/}
                        <TableCell align="right">
                          {format(new Date(item.createdAt), "MMM d")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No {category} found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </GridItem>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentItems;
