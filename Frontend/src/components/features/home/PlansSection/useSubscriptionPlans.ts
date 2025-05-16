// src/components/features/home/PlansSection/useSubscriptionPlans.ts
import { useAppSelector, useAppDispatch } from "@/store/store";
import { fetchSubscriptionPlans } from "@/store/slices/subscriptionSlice";
import { useEffect } from "react";

export const useSubscriptionPlans = () => {
  const dispatch = useAppDispatch();
  const { plans, loading } = useAppSelector((state) => state.subscriptions);

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  return { plans, loading };
};
