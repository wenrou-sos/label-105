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

    traceCode.status = 'used';
    traceCode.usedBy = req.user.id;
    traceCode.usedAt = new Date();
    traceCode.customerId = customerId ? Number(customerId) : undefined;
    traceCode.surgeryId = surgeryId ? Number(surgeryId) : undefined;
    traceCode.updatedAt = new Date();

    const batch = db.medicineBatches.find((b) => b.id === traceCode.batchId);
    if (batch) {
      batch.quantity -= 1;

      const medicine = db.medicines.find((m) => m.id === batch.medicineId);
      if (medicine) {
        medicine.stock -= 1;
        medicine.updatedAt = new Date();
      }
    }

    res.json({
      success: true,
      data: traceCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '扫码出库失败：' + (error as Error).message,
    });
  }
};
