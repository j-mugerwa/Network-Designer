// src/components/features/dashboard/StatsCards.tsx
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import {
  DesignServices as DesignIcon,
  Groups as TeamIcon,
  PersonAdd as InviteIcon,
  CheckCircle as AcceptedIcon,
  Pending as PendingIcon,
  Cancel as DeclinedIcon,
} from "@mui/icons-material";
import { GridItem } from "@/components/layout/GridItem";
import { useAppSelector } from "@/store/store";

const StatCard = ({
  icon,
  title,
  value,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  loading?: boolean;
}) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {icon}
      <div>
        {loading ? (
          <Skeleton variant="text" width={40} height={32} />
        ) : (
          <Typography variant="h6">{value}</Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </div>
    </CardContent>
  </Card>
);

const StatsCards = () => {
  const { stats, loading } = useAppSelector((state) => state.dashboard);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 3,
      }}
    >
      <GridItem>
        <StatCard
          icon={<DesignIcon />}
          title="Designs Created"
          value={stats?.designsCreated || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<DesignIcon />}
          title="Designs Optimized"
          value={stats?.designsOptimized || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<DesignIcon />}
          title="Designs Visualized"
          value={stats?.designsVisualized || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<TeamIcon />}
          title="Teams Created"
          value={stats?.teamsCreated || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<InviteIcon />}
          title="Individuals Invited"
          value={stats?.individualsInvited || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<AcceptedIcon />}
          title="Invitations Accepted"
          value={stats?.invitationsAccepted || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<PendingIcon />}
          title="Invitations Pending"
          value={stats?.invitationsPending || 0}
          loading={loading}
        />
      </GridItem>
      <GridItem>
        <StatCard
          icon={<DeclinedIcon />}
          title="Invitations Declined"
          value={stats?.invitationsDeclined || 0}
          loading={loading}
        />
      </GridItem>
    </Box>
  );
};

export default StatsCards;
