import type { Response } from 'express';
import { getDb, createId } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Surgery, ConsentForm, Supply, PaginatedResponse } from '../../shared/types.js';

export const getSurgeries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, status, customerId } = req.query;

    let surgeries = [...db.surgeries];

    if (status) {
      surgeries = surgeries.filter((s) => s.status === status);
    }

    if (customerId) {
      surgeries = surgeries.filter((s) => s.customerId === Number(customerId));
    }

    const total = surgeries.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = surgeries.slice(start, end).map((s) => ({
      ...s,
      customerName: db.customers.find((c) => c.id === s.customerId)?.name,
      surgeonName: db.users.find((u) => u.id === s.surgeonId)?.name,
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
      error: '获取手术列表失败：' + (error as Error).message,
    });
  }
};

export const getSurgeryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const surgery = db.surgeries.find((s) => s.id === Number(id));

    if (!surgery) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    const customer = db.customers.find((c) => c.id === surgery.customerId);
    const surgeon = db.users.find((u) => u.id === surgery.surgeonId);
    const consentForm = db.consentForms.find((cf) => cf.surgeryId === surgery.id);
    const supplies = db.supplies.filter((sp) => sp.surgeryId === surgery.id);
    const postOpVisits = db.postOpVisits.filter((v) => v.surgeryId === surgery.id);
    const complications = db.complications.filter((c) => c.surgeryId === surgery.id);

    const surgeryWithDetails = {
      ...surgery,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      surgeonName: surgeon?.name,
      consentForm,
      supplies,
      postOpVisits,
      complications,
    };

    res.json({
      success: true,
      data: surgeryWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取手术详情失败：' + (error as Error).message,
    });
  }
};

export const createSurgery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { customerId, surgeryDate, surgeonId, anesthesiaType, surgeryName, operationNotes } = req.body;

    if (!customerId || !surgeryDate || !surgeonId || !anesthesiaType || !surgeryName) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    const db = await getDb();

    const customer = db.customers.find((c) => c.id === Number(customerId));
    if (!customer) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    const surgeon = db.users.find((u) => u.id === Number(surgeonId));
    if (!surgeon) {
      res.status(404).json({
        success: false,
        error: '医生不存在',
      });
      return;
    }

    const surgery: Surgery = {
      id: createId('surgeries'),
      customerId: Number(customerId),
      surgeryDate: new Date(surgeryDate),
      surgeonId: Number(surgeonId),
      anesthesiaType,
      surgeryName,
      status: 'scheduled',
      operationNotes,
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date(),
    };

    db.surgeries.push(surgery);

    res.status(201).json({
      success: true,
      data: surgery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建手术失败：' + (error as Error).message,
    });
  }
};

export const updateSurgery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { surgeryDate, surgeonId, anesthesiaType, surgeryName, status, operationNotes } = req.body;

    const db = await getDb();
    const index = db.surgeries.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    if (surgeonId) {
      const surgeon = db.users.find((u) => u.id === Number(surgeonId));
      if (!surgeon) {
        res.status(404).json({
          success: false,
          error: '医生不存在',
        });
        return;
      }
    }

    db.surgeries[index] = {
      ...db.surgeries[index],
      surgeryDate: surgeryDate ? new Date(surgeryDate) : db.surgeries[index].surgeryDate,
      surgeonId: surgeonId || db.surgeries[index].surgeonId,
      anesthesiaType: anesthesiaType || db.surgeries[index].anesthesiaType,
      surgeryName: surgeryName || db.surgeries[index].surgeryName,
      status: status || db.surgeries[index].status,
      operationNotes: operationNotes !== undefined ? operationNotes : db.surgeries[index].operationNotes,
    };

    res.json({
      success: true,
      data: db.surgeries[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新手术失败：' + (error as Error).message,
    });
  }
};

export const deleteSurgery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.surgeries.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    const surgery = db.surgeries[index];
    if (surgery.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        error: '只能删除待安排的手术',
      });
      return;
    }

    db.consentForms = db.consentForms.filter((cf) => cf.surgeryId !== Number(id));
    db.supplies = db.supplies.filter((sp) => sp.surgeryId !== Number(id));
    db.postOpVisits = db.postOpVisits.filter((v) => v.surgeryId !== Number(id));
    db.complications = db.complications.filter((c) => c.surgeryId !== Number(id));
    db.surgeries.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除手术失败：' + (error as Error).message,
    });
  }
};

export const getConsentForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { surgeryId } = req.params;
    const db = await getDb();

    const consentForm = db.consentForms.find((cf) => cf.surgeryId === Number(surgeryId));

    res.json({
      success: true,
      data: consentForm || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取知情同意书失败：' + (error as Error).message,
    });
  }
};

export const createOrUpdateConsentForm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { surgeryId } = req.params;
    const { content, signature, signedBy } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: '同意书内容不能为空',
      });
      return;
    }

    const db = await getDb();

    const surgery = db.surgeries.find((s) => s.id === Number(surgeryId));
    if (!surgery) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    let consentForm = db.consentForms.find((cf) => cf.surgeryId === Number(surgeryId));

    if (consentForm) {
      consentForm.content = content;
      consentForm.signature = signature || consentForm.signature;
      consentForm.signedBy = signedBy || consentForm.signedBy;
      if (signature && !consentForm.signedAt) {
        consentForm.signedAt = new Date();
      }
      consentForm.witnessId = req.user.id;
    } else {
      consentForm = {
        id: createId('consentForms'),
        surgeryId: Number(surgeryId),
        content,
        signature,
        signedBy,
        signedAt: signature ? new Date() : undefined,
        witnessId: req.user.id,
      } as ConsentForm;
      db.consentForms.push(consentForm);
    }

    res.json({
      success: true,
      data: consentForm,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '保存知情同意书失败：' + (error as Error).message,
    });
  }
};

export const getSupplies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { surgeryId } = req.params;
    const db = await getDb();

    const supplies = db.supplies.filter((sp) => sp.surgeryId === Number(surgeryId));

    res.json({
      success: true,
      data: supplies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取耗材列表失败：' + (error as Error).message,
    });
  }
};

export const addSupply = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { surgeryId } = req.params;
    const { name, brand, batchNumber, expiryDate, type, isImplant, traceCode, customerId } = req.body;

    if (!name || !brand || !batchNumber || !expiryDate || !type) {
      res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
      return;
    }

    const db = await getDb();

    const surgery = db.surgeries.find((s) => s.id === Number(surgeryId));
    if (!surgery) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    const supply: Supply = {
      id: createId('supplies'),
      surgeryId: Number(surgeryId),
      name,
      brand,
      batchNumber,
      expiryDate: new Date(expiryDate),
      type,
      isImplant: isImplant || false,
      traceCode,
      customerId: customerId || surgery.customerId,
      usedAt: new Date(),
    };

    db.supplies.push(supply);

    res.status(201).json({
      success: true,
      data: supply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '添加耗材失败：' + (error as Error).message,
    });
  }
};

export const removeSupply = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplyId } = req.params;
    const db = await getDb();

    const index = db.supplies.findIndex((sp) => sp.id === Number(supplyId));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '耗材不存在',
      });
      return;
    }

    db.supplies.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除耗材失败：' + (error as Error).message,
    });
  }
};
