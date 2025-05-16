// components/auth/ProtectedRoute.tsx
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store/store";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return <>{isAuthenticated ? children : null}</>;
};
