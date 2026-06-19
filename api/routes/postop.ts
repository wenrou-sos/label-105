import { Router, type Request, type Response } from 'express';
import {
  getPostOpVisits,
  getPostOpVisitById,
  createPostOpVisit,
  updatePostOpVisit,
  deletePostOpVisit,
  getComplications,
  createComplication,
  updateComplication,
  deleteComplication,
  getPhotoComparison,
  uploadPostOpPhoto,
} from '../controllers/postop.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/visits', requirePermission('postop:read'), async (req: Request, res: Response) => {
  await getPostOpVisits(req, res);
});

router.get('/visits/:id', requirePermission('postop:read'), async (req: Request, res: Response) => {
  await getPostOpVisitById(req, res);
});

router.post('/visits', requirePermission('postop:create'), async (req: Request, res: Response) => {
  await createPostOpVisit(req, res);
});

router.put('/visits/:id', requirePermission('postop:update'), async (req: Request, res: Response) => {
  await updatePostOpVisit(req, res);
});

router.delete('/visits/:id', requirePermission('postop:delete'), async (req: Request, res: Response) => {
  await deletePostOpVisit(req, res);
});

router.get('/complications', requirePermission('postop:read'), async (req: Request, res: Response) => {
  await getComplications(req, res);
});

router.get('/surgeries/:surgeryId/complications', requirePermission('postop:read'), async (req: Request, res: Response) => {
  await getComplications(req, res);
});

router.post('/complications', requirePermission('postop:create'), async (req: Request, res: Response) => {
  await createComplication(req, res);
});

router.put('/complications/:id', requirePermission('postop:update'), async (req: Request, res: Response) => {
  await updateComplication(req, res);
});

router.delete('/complications/:id', requirePermission('postop:delete'), async (req: Request, res: Response) => {
  await deleteComplication(req, res);
});

router.get('/photos/comparison/:customerId', requirePermission('photo:view'), async (req: Request, res: Response) => {
  await getPhotoComparison(req, res);
});

router.get('/photos/comparison/:customerId/:surgeryId', requirePermission('photo:view'), async (req: Request, res: Response) => {
  await getPhotoComparison(req, res);
});

router.post('/visits/:visitId/photos', requirePermission('photo:upload'), async (req: Request, res: Response) => {
  await uploadPostOpPhoto(req, res);
});

export default router;
