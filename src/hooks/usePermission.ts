import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth.ts';
import type { UserRole } from '../../shared/types.ts';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  consultant: 3,
  doctor: 2,
  nurse: 1,
};

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const hasPermission = useMemo(() => {
    return (permission: string | string[]): boolean => {
      if (!isAuthenticated || !user) return false;

      const permissions = Array.isArray(permission) ? permission : [permission];

      if (user.role === 'admin') return true;

      return permissions.some((p) => user.permissions.includes(p));
    };
  }, [isAuthenticated, user]);

  const hasRole = useMemo(() => {
    return (role: UserRole | UserRole[]): boolean => {
      if (!isAuthenticated || !user) return false;

      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    };
  }, [isAuthenticated, user]);

  const hasMinimumRole = useMemo(() => {
    return (role: UserRole): boolean => {
      if (!isAuthenticated || !user) return false;

      const userLevel = ROLE_HIERARCHY[user.role];
      const requiredLevel = ROLE_HIERARCHY[role];

      return userLevel >= requiredLevel;
    };
  }, [isAuthenticated, user]);

  const canAccess = useMemo(() => {
    return (options: {
      permission?: string | string[];
      role?: UserRole | UserRole[];
      minimumRole?: UserRole;
    }): boolean => {
      if (!isAuthenticated || !user) return false;

      const { permission, role, minimumRole } = options;

      if (permission && !hasPermission(permission)) return false;
      if (role && !hasRole(role)) return false;
      if (minimumRole && !hasMinimumRole(minimumRole)) return false;

      return true;
    };
  }, [isAuthenticated, hasPermission, hasRole, hasMinimumRole]);

  return {
    hasPermission,
    hasRole,
    hasMinimumRole,
    canAccess,
    user,
    isAuthenticated,
  };
};
