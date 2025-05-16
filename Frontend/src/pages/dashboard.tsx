import DashboardComponent from "@/components/pages/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";

function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardComponent />
    </AuthGuard>
  );
}

export default DashboardPage;
