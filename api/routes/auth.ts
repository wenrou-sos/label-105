import { Router, type Request, type Response } from 'express';
import { login, logout, getCurrentUser, changePassword } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  await login(req, res);
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  await logout(req, res);
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  await getCurrentUser(req, res);
});

router.put('/password', authMiddleware, async (req: Request, res: Response) => {
  await changePassword(req, res);
});

export default router;
