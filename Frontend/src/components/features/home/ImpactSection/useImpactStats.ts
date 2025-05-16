// src/components/features/home/ImpactSection/useImpactStats.ts
import { useAppSelector, useAppDispatch } from "@/store/store";
import { fetchSystemStats } from "@/store/slices/statsSlice";
import { useEffect } from "react";

export const useImpactStats = () => {
  const dispatch = useAppDispatch();
  const { users, companies, designs, reports, loading } = useAppSelector(
    (state) => state.stats
  );

  useEffect(() => {
    dispatch(fetchSystemStats());
  }, [dispatch]);

  const stats = [
    {
      title: "Active Users",
      value: users,
      description: "Professionals using our platform",
    },
    {
      title: "Companies",
      value: companies,
      description: "Businesses trusting our solutions",
    },
    {
      title: "Network Designs",
      value: designs,
      description: "Infrastructure plans created",
    },
    {
      title: "Reports Generated",
      value: reports,
      description: "Detailed analysis documents",
    },
  ];

  return { stats, loading };
};
