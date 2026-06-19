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
