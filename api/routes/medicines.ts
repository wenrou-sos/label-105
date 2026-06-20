import { Router, type Request, type Response } from 'express';
import {
  getMedicines,
  getLowStockMedicines,
  getExpiringMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getBatches,
  createBatch,
  getTraceCodes,
  getTraceCodeByCode,
  scanInbound,
  scanOutbound,
} from '../controllers/medicines.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getMedicines(req, res);
});

router.get('/low-stock', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getLowStockMedicines(req, res);
});

router.get('/expiring', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getExpiringMedicines(req, res);
});

router.get('/:id', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getMedicineById(req, res);
});

router.post('/', requirePermission('medicine:create'), async (req: Request, res: Response) => {
  await createMedicine(req, res);
});

router.put('/:id', requirePermission('medicine:update'), async (req: Request, res: Response) => {
  await updateMedicine(req, res);
});

router.delete('/:id', requirePermission('medicine:delete'), async (req: Request, res: Response) => {
  await deleteMedicine(req, res);
});

router.get('/:medicineId/batches', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getBatches(req, res);
});

router.get('/batches', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getBatches(req, res);
});

router.post('/batches', requirePermission('medicine:create'), async (req: Request, res: Response) => {
  await createBatch(req, res);
});

router.get('/trace-codes', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getTraceCodes(req, res);
});

router.get('/trace-codes/:code', requirePermission('medicine:read'), async (req: Request, res: Response) => {
  await getTraceCodeByCode(req, res);
});

router.post('/scan/inbound', requirePermission('medicine:create'), async (req: Request, res: Response) => {
  await scanInbound(req, res);
});

router.post('/scan/outbound', requirePermission('medicine:update'), async (req: Request, res: Response) => {
  await scanOutbound(req, res);
});

export default router;
