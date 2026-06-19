import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, hashPassword } from '../utils/db.js';
import { generateToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { User, LoginRequest } from '../../shared/types.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.username === username);

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: '用户已被禁用',
      });
      return;
    }

    const isValid = await bcrypt.compare(password, (user as User & { passwordHash: string }).passwordHash);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const token = generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user as User & { passwordHash: string };

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败：' + (error as Error).message,
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        message: '登出成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登出失败：' + (error as Error).message,
    });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user!.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    const { passwordHash, ...userWithoutPassword } = user as User & { passwordHash?: string };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败：' + (error as Error).message,
    });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: '旧密码和新密码不能为空',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: '新密码长度不能少于6位',
      });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user!.id) as User & { passwordHash: string };

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: '旧密码错误',
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);

    res.json({
      success: true,
      data: {
        message: '密码修改成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '修改密码失败：' + (error as Error).message,
    });
  }
};
