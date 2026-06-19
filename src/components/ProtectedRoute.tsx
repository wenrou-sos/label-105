import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Spin } from '@arco-design/web-react';
import { useAuthStore } from '@/store/auth.ts';
import { usePermission } from '@/hooks/usePermission.ts';
import type { UserRole } from '../../shared/types.ts';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  permission?: string | string[];
  role?: UserRole | UserRole[];
  minimumRole?: UserRole;
}

export default function ProtectedRoute({
  children,
  permission,
  role,
  minimumRole,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { canAccess } = usePermission();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission || role || minimumRole) {
    const hasAccess = canAccess({ permission, role, minimumRole });
    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children || <Outlet />}</>;
}
