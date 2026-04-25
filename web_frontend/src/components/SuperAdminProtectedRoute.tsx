import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

/** Only the primary admin (ADMIN_EMAIL in JWT / `is_super_admin`) may access child routes. */
const SuperAdminProtectedRoute = ({ children }: Props) => {
  const { user, loading, isSuperAdmin, adminLoading } = useAuth();

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
