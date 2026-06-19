import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { getDb } from '../utils/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: '无效或已过期的令牌',
    });
    return;
  }

  const db = await getDb();
  const user = db.users.find((u) => u.id === payload.userId);

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: '用户不存在或已被禁用',
    });
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
  };

  next();
};

export const requirePermission = (permission: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const hasPermission =
      req.user.permissions.includes('*') ||
      req.user.permissions.includes(permission) ||
      req.user.permissions.some((p) => {
        const [resource] = permission.split(':');
        return p === `${resource}:*`;
      });

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: '权限不足',
      });
      return;
    }

    next();
  };
};
