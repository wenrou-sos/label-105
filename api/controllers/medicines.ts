import type { Response } from 'express';
import { getDb, createId } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Medicine, MedicineBatch, TraceCode, PaginatedResponse } from '../../shared/types.js';

export const getMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, keyword, category } = req.query;

    let medicines = [...db.medicines];

    if (keyword) {
      const kw = String(keyword).toLowerCase();
      medicines = medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(kw) ||
          m.manufacturer.toLowerCase().includes(kw) ||
          m.specifications.toLowerCase().includes(kw)
      );
    }

    if (category) {
      medicines = medicines.filter((m) => m.category === category);
    }

    const total = medicines.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = medicines.slice(start, end);

    const result: PaginatedResponse<Medicine> = {
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
      error: '获取药品列表失败：' + (error as Error).message,
    });
  }
};

const LOW_STOCK_THRESHOLD = 10;
const NEAR_EXPIRY_DAYS = 30;

const computeExpiryStatus = (expiryDate: Date): { status: 'expired' | 'near' | 'normal'; daysLeft: number } => {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryStartOfDay = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  );
  const daysLeft = Math.ceil(
    (expiryStartOfDay.getTime() - startOfDay.getTime()) / msPerDay
  );

  if (daysLeft < 0) {
    return { status: 'expired', daysLeft };
  }
  if (daysLeft <= NEAR_EXPIRY_DAYS) {
    return { status: 'near', daysLeft };
  }
  return { status: 'normal', daysLeft };
};

export const getLowStockMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const threshold = req.query.threshold ? Number(req.query.threshold) : LOW_STOCK_THRESHOLD;

    const list = db.medicines
      .filter((m) => m.stock < threshold)
      .sort((a, b) => a.stock - b.stock)
      .map((m) => ({
        ...m,
        lowStock: true,
        threshold,
      }));

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取低库存药品失败：' + (error as Error).message,
    });
  }
};

export const getExpiringMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const days = req.query.days ? Number(req.query.days) : NEAR_EXPIRY_DAYS;
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const list = db.medicineBatches
      .filter((b) => {
        const expiry = new Date(b.expiryDate);
        return expiry <= deadline;
      })
      .map((b) => {
        const medicine = db.medicines.find((m) => m.id === b.medicineId);
        const { status, daysLeft } = computeExpiryStatus(b.expiryDate);
        return {
          ...b,
          medicineId: b.medicineId,
          medicineName: medicine?.name,
          medicineSpecifications: medicine?.specifications,
          unit: medicine?.unit,
          receivedByName: db.users.find((u) => u.id === b.receivedBy)?.name,
          expiryStatus: status,
          daysLeft,
        };
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取临期药品失败：' + (error as Error).message,
    });
  }
};

export const getMedicineById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const medicine = db.medicines.find((m) => m.id === Number(id));

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: '药品不存在',
      });
      return;
    }

    const batches = db.medicineBatches
      .filter((b) => b.medicineId === medicine.id)
      .map((b) => ({
        ...b,
        traceCodes: db.traceCodes.filter((t) => t.batchId === b.id),
        receivedByName: db.users.find((u) => u.id === b.receivedBy)?.name,
      }));

    const medicineWithDetails = {
      ...medicine,
      batches,
    };

    res.json({
      success: true,
      data: medicineWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取药品详情失败：' + (error as Error).message,
    });
  }
};

export const createMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { name, category, manufacturer, specifications, unit } = req.body;

    if (!name || !category || !manufacturer || !specifications || !unit) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    const db = await getDb();

    const existing = db.medicines.find((m) => m.name === name && m.specifications === specifications);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '该药品已存在',
      });
      return;
    }

    const medicine: Medicine = {
      id: createId('medicines'),
      name,
      category,
      manufacturer,
      specifications,
      stock: 0,
      unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.medicines.push(medicine);

    res.status(201).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建药品失败：' + (error as Error).message,
    });
  }
};

export const updateMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, manufacturer, specifications, unit } = req.body;

    const db = await getDb();
    const index = db.medicines.findIndex((m) => m.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '药品不存在',
      });
      return;
    }

    if (name || specifications) {
      const existing = db.medicines.find(
        (m) =>
          m.id !== Number(id) &&
          m.name === (name || db.medicines[index].name) &&
          m.specifications === (specifications || db.medicines[index].specifications)
      );
      if (existing) {
        res.status(400).json({
          success: false,
          error: '该药品已存在',
        });
        return;
      }
    }

    db.medicines[index] = {
      ...db.medicines[index],
      name: name || db.medicines[index].name,
      category: category || db.medicines[index].category,
      manufacturer: manufacturer || db.medicines[index].manufacturer,
      specifications: specifications || db.medicines[index].specifications,
      unit: unit || db.medicines[index].unit,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      data: db.medicines[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新药品失败：' + (error as Error).message,
    });
  }
};

export const deleteMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.medicines.findIndex((m) => m.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '药品不存在',
      });
      return;
    }

    const batches = db.medicineBatches.filter((b) => b.medicineId === Number(id));
    if (batches.length > 0) {
      res.status(400).json({
        success: false,
        error: '该药品存在批次记录，无法删除',
      });
      return;
    }

    db.medicines.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除药品失败：' + (error as Error).message,
    });
  }
};

export const getBatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { medicineId } = req.params;
    const db = await getDb();

    let batches = [...db.medicineBatches];

    if (medicineId) {
      batches = batches.filter((b) => b.medicineId === Number(medicineId));
    }

    const list = batches.map((b) => ({
      ...b,
      medicineName: db.medicines.find((m) => m.id === b.medicineId)?.name,
      traceCodes: db.traceCodes.filter((t) => t.batchId === b.id),
      receivedByName: db.users.find((u) => u.id === b.receivedBy)?.name,
    }));

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取批次列表失败：' + (error as Error).message,
    });
  }
};

export const createBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { medicineId, batchNumber, expiryDate, quantity, receivedDate, traceCodes } = req.body;

    if (!medicineId || !batchNumber || !expiryDate || quantity === undefined || !receivedDate) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    const db = await getDb();

    const medicine = db.medicines.find((m) => m.id === Number(medicineId));
    if (!medicine) {
      res.status(404).json({
        success: false,
        error: '药品不存在',
      });
      return;
    }

    const existing = db.medicineBatches.find((b) => b.batchNumber === batchNumber);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '该批次号已存在',
      });
      return;
    }

    const batchId = createId('medicineBatches');

    const batch: MedicineBatch = {
      id: batchId,
      medicineId: Number(medicineId),
      batchNumber,
      expiryDate: new Date(expiryDate),
      quantity,
      receivedDate: new Date(receivedDate),
      receivedBy: req.user.id,
      traceCodes: [],
    };

    db.medicineBatches.push(batch);

    if (traceCodes && Array.isArray(traceCodes) && traceCodes.length > 0) {
      for (const code of traceCodes) {
        const existingCode = db.traceCodes.find((t) => t.code === code);
        if (!existingCode) {
          const traceCode: TraceCode = {
            id: createId('traceCodes'),
            code,
            batchId,
            status: 'in_stock',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          db.traceCodes.push(traceCode);
        }
      }
    }

    medicine.stock += quantity;
    medicine.updatedAt = new Date();

    const createdBatch = {
      ...batch,
      traceCodes: db.traceCodes.filter((t) => t.batchId === batchId),
    };

    res.status(201).json({
      success: true,
      data: createdBatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建批次失败：' + (error as Error).message,
    });
  }
};

export const getTraceCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { batchId, status } = req.query;
    const db = await getDb();

    let traceCodes = [...db.traceCodes];

    if (batchId) {
      traceCodes = traceCodes.filter((t) => t.batchId === Number(batchId));
    }

    if (status) {
      traceCodes = traceCodes.filter((t) => t.status === status);
    }

    const list = traceCodes.map((t) => {
      const batch = db.medicineBatches.find((b) => b.id === t.batchId);
      const medicine = batch ? db.medicines.find((m) => m.id === batch.medicineId) : undefined;
      return {
        ...t,
        batchNumber: batch?.batchNumber,
        medicineName: medicine?.name,
        usedByName: t.usedBy ? db.users.find((u) => u.id === t.usedBy)?.name : undefined,
        customerName: t.customerId ? db.customers.find((c) => c.id === t.customerId)?.name : undefined,
      };
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取追溯码列表失败：' + (error as Error).message,
    });
  }
};

export const getTraceCodeByCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const db = await getDb();

    const traceCode = db.traceCodes.find((t) => t.code === code);

    if (!traceCode) {
      res.status(404).json({
        success: false,
        error: '追溯码不存在',
      });
      return;
    }

    const batch = db.medicineBatches.find((b) => b.id === traceCode.batchId);
    const medicine = batch ? db.medicines.find((m) => m.id === batch.medicineId) : undefined;

    const traceCodeWithDetails = {
      ...traceCode,
      batchNumber: batch?.batchNumber,
      expiryDate: batch?.expiryDate,
      medicineName: medicine?.name,
      medicineSpecifications: medicine?.specifications,
      usedByName: traceCode.usedBy ? db.users.find((u) => u.id === traceCode.usedBy)?.name : undefined,
      customerName: traceCode.customerId ? db.customers.find((c) => c.id === traceCode.customerId)?.name : undefined,
    };

    res.json({
      success: true,
      data: traceCodeWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '查询追溯码失败：' + (error as Error).message,
    });
  }
};

export const scanInbound = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { code, batchId } = req.body;

    if (!code || !batchId) {
      res.status(400).json({
        success: false,
        error: '追溯码和批次ID不能为空',
      });
      return;
    }

    const db = await getDb();

    const batch = db.medicineBatches.find((b) => b.id === Number(batchId));
    if (!batch) {
      res.status(404).json({
        success: false,
        error: '批次不存在',
      });
      return;
    }

    const existing = db.traceCodes.find((t) => t.code === code);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '该追溯码已存在',
      });
      return;
    }

    const traceCode: TraceCode = {
      id: createId('traceCodes'),
      code,
      batchId: Number(batchId),
      status: 'in_stock',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.traceCodes.push(traceCode);

    const medicine = db.medicines.find((m) => m.id === batch.medicineId);
    if (medicine) {
      medicine.stock += 1;
      medicine.updatedAt = new Date();
    }

    batch.quantity += 1;

    res.status(201).json({
      success: true,
      data: traceCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '扫码入库失败：' + (error as Error).message,
    });
  }
};

export const scanOutbound = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { code, customerId, surgeryId } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: '追溯码不能为空',
      });
      return;
    }

    const db = await getDb();

    const traceCode = db.traceCodes.find((t) => t.code === code);

    if (!traceCode) {
      res.status(404).json({
        success: false,
        error: '追溯码不存在',
      });
      return;
    }

    if (traceCode.status !== 'in_stock') {
      res.status(400).json({
        success: false,
        error: '该追溯码状态不正确，当前状态：' + traceCode.status,
      });
      return;
    }

    const batch = db.medicineBatches.find((b) => b.id === traceCode.batchId);
    if (!batch) {
      res.status(404).json({
        success: false,
        error: '所属批次不存在',
      });
      return;
    }

    const expiryInfo = computeExpiryStatus(batch.expiryDate);
    if (expiryInfo.status === 'expired') {
      res.status(400).json({
        success: false,
        error: `该药品已过期（批次 ${batch.batchNumber}），禁止出库`,
      });
      return;
    }

    traceCode.status = 'used';
    traceCode.usedBy = req.user.id;
    traceCode.usedAt = new Date();
    traceCode.customerId = customerId ? Number(customerId) : undefined;
    traceCode.surgeryId = surgeryId ? Number(surgeryId) : undefined;
    traceCode.updatedAt = new Date();

    batch.quantity -= 1;

    const medicine = db.medicines.find((m) => m.id === batch.medicineId);
    if (medicine) {
      medicine.stock -= 1;
      medicine.updatedAt = new Date();
    }

    res.json({
      success: true,
      data: traceCode,
      message:
        expiryInfo.status === 'near'
          ? expiryInfo.daysLeft === 0
            ? `提示：批次 ${batch.batchNumber} 今日到期，请尽快使用`
            : `提示：批次 ${batch.batchNumber} 距过期仅剩 ${expiryInfo.daysLeft} 天`
          : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '扫码出库失败：' + (error as Error).message,
    });
  }
};
