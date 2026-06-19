import { Router, type Request, type Response } from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/system.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', requirePermission('system:read'), async (req: Request, res: Response) => {
  await getDashboardStats(req, res);
});

router.get('/users', requirePermission('user:read'), async (req: Request, res: Response) => {
  await getUsers(req, res);
});

router.get('/users/:id', requirePermission('user:read'), async (req: Request, res: Response) => {
  await getUserById(req, res);
});

router.post('/users', requirePermission('user:create'), async (req: Request, res: Response) => {
  await createUser(req, res);
});

router.put('/users/:id', requirePermission('user:update'), async (req: Request, res: Response) => {
  await updateUser(req, res);
});

router.delete('/users/:id', requirePermission('user:delete'), async (req: Request, res: Response) => {
  await deleteUser(req, res);
});

router.get('/roles', requirePermission('role:read'), async (req: Request, res: Response) => {
  await getRoles(req, res);
});

router.get('/roles/:id', requirePermission('role:read'), async (req: Request, res: Response) => {
  await getRoleById(req, res);
});

router.post('/roles', requirePermission('role:create'), async (req: Request, res: Response) => {
  await createRole(req, res);
});

router.put('/roles/:id', requirePermission('role:update'), async (req: Request, res: Response) => {
  await updateRole(req, res);
});

router.delete('/roles/:id', requirePermission('role:delete'), async (req: Request, res: Response) => {
  await deleteRole(req, res);
});

export default router;
