import { Router, type Request, type Response } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getConsultation,
  createOrUpdateConsultation,
  getPhotos,
  uploadPhoto,
  deletePhoto,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getCustomerTags,
  updateCustomerTags,
  getTagStats,
} from '../controllers/customers.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('customer:read'), async (req: Request, res: Response) => {
  await getCustomers(req, res);
});

router.get('/:id', requirePermission('customer:read'), async (req: Request, res: Response) => {
  await getCustomerById(req, res);
});

router.post('/', requirePermission('customer:create'), async (req: Request, res: Response) => {
  await createCustomer(req, res);
});

router.put('/:id', requirePermission('customer:update'), async (req: Request, res: Response) => {
  await updateCustomer(req, res);
});

router.delete('/:id', requirePermission('customer:delete'), async (req: Request, res: Response) => {
  await deleteCustomer(req, res);
});

router.get('/tags/list', requirePermission('customer:read'), async (req: Request, res: Response) => {
  await getTags(req, res);
});

router.post('/tags', requirePermission('customer:update'), async (req: Request, res: Response) => {
  await createTag(req, res);
});

router.put('/tags/:id', requirePermission('customer:update'), async (req: Request, res: Response) => {
  await updateTag(req, res);
});

router.delete('/tags/:id', requirePermission('customer:update'), async (req: Request, res: Response) => {
  await deleteTag(req, res);
});

router.get('/tags/stats', requirePermission('customer:read'), async (req: Request, res: Response) => {
  await getTagStats(req, res);
});

router.get('/:customerId/tags', requirePermission('customer:read'), async (req: Request, res: Response) => {
  await getCustomerTags(req, res);
});

router.put('/:customerId/tags', requirePermission('customer:update'), async (req: Request, res: Response) => {
  await updateCustomerTags(req, res);
});

router.get('/:customerId/consultation', requirePermission('consultation:read'), async (req: Request, res: Response) => {
  await getConsultation(req, res);
});

router.post('/:customerId/consultation', requirePermission('consultation:create'), async (req: Request, res: Response) => {
  await createOrUpdateConsultation(req, res);
});

router.put('/:customerId/consultation', requirePermission('consultation:update'), async (req: Request, res: Response) => {
  await createOrUpdateConsultation(req, res);
});

router.get('/:customerId/photos', requirePermission('photo:view'), async (req: Request, res: Response) => {
  await getPhotos(req, res);
});

router.post('/:customerId/photos', requirePermission('photo:upload'), async (req: Request, res: Response) => {
  await uploadPhoto(req, res);
});

router.delete('/photos/:photoId', requirePermission('photo:delete'), async (req: Request, res: Response) => {
  await deletePhoto(req, res);
});

export default router;
