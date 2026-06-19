import type { Response } from 'express';
import { getDb, createId, hashPassword } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { User, Role, DashboardStats, PaginatedResponse, UserRole } from '../../shared/types.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayConsultations = db.consultations.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= today && createdAt < tomorrow;
    }).length;

    const todaySurgeries = db.surgeries.filter((s) => {
      const surgeryDate = new Date(s.surgeryDate);
      return surgeryDate >= today && surgeryDate < tomorrow;
    }).length;

    const totalCustomers = db.customers.length;
    const totalRevenue = db.surgeries.filter((s) => s.status === 'completed').length * 8000;

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const count = db.surgeries.filter((s) => {
        const surgeryDate = new Date(s.surgeryDate);
        return surgeryDate >= monthStart && surgeryDate < nextMonth;
      }).length;

      monthlyTrend.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        value: count,
      });
    }

    const surgeryDistributionMap: Record<string, number> = {};
    db.surgeries.forEach((s) => {
      surgeryDistributionMap[s.surgeryName] = (surgeryDistributionMap[s.surgeryName] || 0) + 1;
    });
    const surgeryDistribution = Object.entries(surgeryDistributionMap).map(([name, value]) => ({ name, value }));

    const areaDistributionMap: Record<string, number> = {};
    db.consultations.forEach((c) => {
      c.targetAreas.forEach((area) => {
        areaDistributionMap[area] = (areaDistributionMap[area] || 0) + 1;
      });
    });
    const areaDistribution = Object.entries(areaDistributionMap).map(([name, value]) => ({ name, value }));

    const stats: DashboardStats = {
      todayConsultations,
      todaySurgeries,
      totalCustomers,
      totalRevenue,
      monthlyTrend,
      surgeryDistribution,
      areaDistribution,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取仪表盘统计失败：' + (error as Error).message,
    });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, keyword, role } = req.query;

    let users = [...db.users];

    if (keyword) {
      const kw = String(keyword).toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(kw) ||
          u.username.toLowerCase().includes(kw)
      );
    }

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    const total = users.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = users.slice(start, end).map(({ passwordHash, ...user }) => ({
      ...user,
      roleName: db.roles.find((r) => r.code === user.role)?.name,
    }));

    const result: PaginatedResponse<typeof list[0]> = {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败：' + (error as Error).message,
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const user = db.users.find((u) => u.id === Number(id));

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    const { passwordHash, ...userWithoutPassword } = user as User & { passwordHash?: string };
    const userWithRole = {
      ...userWithoutPassword,
      roleName: db.roles.find((r) => r.code === user.role)?.name,
    };

    res.json({
      success: true,
      data: userWithRole,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户详情失败：' + (error as Error).message,
    });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { username, name, role, password, permissions, isActive } = req.body;

    if (!username || !name || !role || !password) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: '密码长度不能少于6位',
      });
      return;
    }

    const db = await getDb();

    const existing = db.users.find((u) => u.username === username);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '用户名已存在',
      });
      return;
    }

    const roleObj = db.roles.find((r) => r.code === role);
    if (!roleObj) {
      res.status(400).json({
        success: false,
        error: '角色不存在',
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user: User & { passwordHash: string } = {
      id: createId('users'),
      username,
      name,
      role: role as UserRole,
      permissions: permissions || roleObj.permissions,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      passwordHash,
    };

    db.users.push(user);

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建用户失败：' + (error as Error).message,
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, permissions, isActive, password } = req.body;

    const db = await getDb();
    const index = db.users.findIndex((u) => u.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    if (role) {
      const roleObj = db.roles.find((r) => r.code === role);
      if (!roleObj) {
        res.status(400).json({
          success: false,
          error: '角色不存在',
        });
        return;
      }
    }

    const user = db.users[index] as User & { passwordHash?: string };

    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: '密码长度不能少于6位',
        });
        return;
      }
      user.passwordHash = await hashPassword(password);
    }

    db.users[index] = {
      ...user,
      name: name || user.name,
      role: role || user.role,
      permissions: permissions || user.permissions,
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    const { passwordHash: _, ...userWithoutPassword } = db.users[index] as User & { passwordHash?: string };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新用户失败：' + (error as Error).message,
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.users.findIndex((u) => u.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    if (db.users[index].role === 'admin') {
      const adminCount = db.users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          error: '至少保留一个管理员账户',
        });
        return;
      }
    }

    if (req.user && req.user.id === Number(id)) {
      res.status(400).json({
        success: false,
        error: '不能删除当前登录用户',
      });
      return;
    }

    db.users.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除用户失败：' + (error as Error).message,
    });
  }
};

export const getRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const roles = db.roles.map((r) => ({
      ...r,
      userCount: db.users.filter((u) => u.role === r.code).length,
    }));

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取角色列表失败：' + (error as Error).message,
    });
  }
};

export const getRoleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const role = db.roles.find((r) => r.id === Number(id));

    if (!role) {
      res.status(404).json({
        success: false,
        error: '角色不存在',
      });
      return;
    }

    const roleWithUsers = {
      ...role,
      userCount: db.users.filter((u) => u.role === role.code).length,
    };

    res.json({
      success: true,
      data: roleWithUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取角色详情失败：' + (error as Error).message,
    });
  }
};

export const createRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, permissions, description } = req.body;

    if (!name || !code || !permissions) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    const db = await getDb();

    const existing = db.roles.find((r) => r.code === code);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '角色编码已存在',
      });
      return;
    }

    const role: Role = {
      id: createId('roles'),
      name,
      code,
      permissions,
      description: description || '',
    };

    db.roles.push(role);

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建角色失败：' + (error as Error).message,
    });
  }
};

export const updateRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, permissions, description } = req.body;

    const db = await getDb();
    const index = db.roles.findIndex((r) => r.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '角色不存在',
      });
      return;
    }

    if (['admin', 'consultant', 'doctor', 'nurse'].includes(db.roles[index].code)) {
      res.status(400).json({
        success: false,
        error: '系统内置角色不能修改',
      });
      return;
    }

    db.roles[index] = {
      ...db.roles[index],
      name: name || db.roles[index].name,
      permissions: permissions || db.roles[index].permissions,
      description: description !== undefined ? description : db.roles[index].description,
    };

    res.json({
      success: true,
      data: db.roles[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新角色失败：' + (error as Error).message,
    });
  }
};

export const deleteRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.roles.findIndex((r) => r.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '角色不存在',
      });
      return;
    }

    if (['admin', 'consultant', 'doctor', 'nurse'].includes(db.roles[index].code)) {
      res.status(400).json({
        success: false,
        error: '系统内置角色不能删除',
      });
      return;
    }

    const usersWithRole = db.users.filter((u) => u.role === db.roles[index].code);
    if (usersWithRole.length > 0) {
      res.status(400).json({
        success: false,
        error: '该角色下存在用户，无法删除',
      });
      return;
    }

    db.roles.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除角色失败：' + (error as Error).message,
    });
  }
};
