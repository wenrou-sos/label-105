import { Router, type Request, type Response } from 'express';
import {
  getSurgeries,
  getSurgeryById,
  createSurgery,
  updateSurgery,
  deleteSurgery,
  getConsentForm,
  createOrUpdateConsentForm,
  getSupplies,
  addSupply,
  removeSupply,
} from '../controllers/surgeries.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('surgery:read'), async (req: Request, res: Response) => {
  await getSurgeries(req, res);
});

router.get('/:id', requirePermission('surgery:read'), async (req: Request, res: Response) => {
  await getSurgeryById(req, res);
});

router.post('/', requirePermission('surgery:create'), async (req: Request, res: Response) => {
  await createSurgery(req, res);
});

router.put('/:id', requirePermission('surgery:update'), async (req: Request, res: Response) => {
  await updateSurgery(req, res);
});

router.delete('/:id', requirePermission('surgery:delete'), async (req: Request, res: Response) => {
  await deleteSurgery(req, res);
});

router.get('/:surgeryId/consent', requirePermission('consent:read'), async (req: Request, res: Response) => {
  await getConsentForm(req, res);
});

router.post('/:surgeryId/consent', requirePermission('consent:create'), async (req: Request, res: Response) => {
  await createOrUpdateConsentForm(req, res);
});

router.put('/:surgeryId/consent', requirePermission('consent:update'), async (req: Request, res: Response) => {
  await createOrUpdateConsentForm(req, res);
});

router.get('/:surgeryId/supplies', requirePermission('supply:read'), async (req: Request, res: Response) => {
  await getSupplies(req, res);
});

router.post('/:surgeryId/supplies', requirePermission('supply:create'), async (req: Request, res: Response) => {
  await addSupply(req, res);
});

router.delete('/supplies/:supplyId', requirePermission('supply:delete'), async (req: Request, res: Response) => {
  await removeSupply(req, res);
});

export default router;
