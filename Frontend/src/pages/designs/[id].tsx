// src/pages/designs/[id].tsx
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchDesignById,
  setCurrentDesign,
} from "@/store/slices/networkDesignSlice";
import { DesignView } from "@/components/features/designs/DesignView";
import { AppLayout } from "@/components/layout/AppLayout";

const DesignPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();
  const { currentDesign, loading, error } = useAppSelector(
    (state) => state.designs
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchDesignById(id as string));
    }
    return () => {
      dispatch(setCurrentDesign(null));
    };
  }, [id, dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentDesign) return <div>Design not found</div>;

  return (
    <AppLayout title="View Design">
      <DesignView design={currentDesign} />
    </AppLayout>
  );
};

export default DesignPage;
