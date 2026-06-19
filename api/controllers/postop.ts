import type { Response } from 'express';
import { getDb, createId } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { PostOpVisit, Complication, Photo, PaginatedResponse } from '../../shared/types.js';

export const getPostOpVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, surgeryId } = req.query;

    let visits = [...db.postOpVisits];

    if (surgeryId) {
      visits = visits.filter((v) => v.surgeryId === Number(surgeryId));
    }

    const total = visits.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = visits.slice(start, end).map((v) => ({
      ...v,
      customerName: db.customers.find((c) => c.id === db.surgeries.find((s) => s.id === v.surgeryId)?.customerId)?.name,
      surgeryName: db.surgeries.find((s) => s.id === v.surgeryId)?.surgeryName,
      recordedByName: db.users.find((u) => u.id === v.recordedBy)?.name,
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
      error: '获取回访列表失败：' + (error as Error).message,
    });
  }
};

export const getPostOpVisitById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const visit = db.postOpVisits.find((v) => v.id === Number(id));

    if (!visit) {
      res.status(404).json({
        success: false,
        error: '回访记录不存在',
      });
      return;
    }

    const surgery = db.surgeries.find((s) => s.id === visit.surgeryId);
    const customer = surgery ? db.customers.find((c) => c.id === surgery.customerId) : undefined;
    const recordedBy = db.users.find((u) => u.id === visit.recordedBy);
    const photos = db.photos.filter((p) => p.postOpVisitId === visit.id);

    const visitWithDetails = {
      ...visit,
      customerName: customer?.name,
      surgeryName: surgery?.surgeryName,
      recordedByName: recordedBy?.name,
      photos,
    };

    res.json({
      success: true,
      data: visitWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取回访详情失败：' + (error as Error).message,
    });
  }
};

export const createPostOpVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { surgeryId, visitDate, swellingLevel, painLevel, bruisingLevel, sutureRemovalDate, notes } = req.body;

    if (!surgeryId || !visitDate || swellingLevel === undefined || painLevel === undefined || bruisingLevel === undefined) {
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

    const visit: PostOpVisit = {
      id: createId('postOpVisits'),
      surgeryId: Number(surgeryId),
      visitDate: new Date(visitDate),
      swellingLevel,
      painLevel,
      bruisingLevel,
      sutureRemovalDate: sutureRemovalDate ? new Date(sutureRemovalDate) : undefined,
      notes: notes || '',
      photos: [],
      recordedBy: req.user.id,
    };

    db.postOpVisits.push(visit);

    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建回访记录失败：' + (error as Error).message,
    });
  }
};

export const updatePostOpVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { visitDate, swellingLevel, painLevel, bruisingLevel, sutureRemovalDate, notes } = req.body;

    const db = await getDb();
    const index = db.postOpVisits.findIndex((v) => v.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '回访记录不存在',
      });
      return;
    }

    db.postOpVisits[index] = {
      ...db.postOpVisits[index],
      visitDate: visitDate ? new Date(visitDate) : db.postOpVisits[index].visitDate,
      swellingLevel: swellingLevel !== undefined ? swellingLevel : db.postOpVisits[index].swellingLevel,
      painLevel: painLevel !== undefined ? painLevel : db.postOpVisits[index].painLevel,
      bruisingLevel: bruisingLevel !== undefined ? bruisingLevel : db.postOpVisits[index].bruisingLevel,
      sutureRemovalDate: sutureRemovalDate ? new Date(sutureRemovalDate) : db.postOpVisits[index].sutureRemovalDate,
      notes: notes !== undefined ? notes : db.postOpVisits[index].notes,
    };

    res.json({
      success: true,
      data: db.postOpVisits[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新回访记录失败：' + (error as Error).message,
    });
  }
};

export const deletePostOpVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.postOpVisits.findIndex((v) => v.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '回访记录不存在',
      });
      return;
    }

    db.photos = db.photos.filter((p) => p.postOpVisitId !== Number(id));
    db.postOpVisits.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除回访记录失败：' + (error as Error).message,
    });
  }
};

export const getComplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { surgeryId } = req.params;
    const db = await getDb();

    let complications = [...db.complications];

    if (surgeryId) {
      complications = complications.filter((c) => c.surgeryId === Number(surgeryId));
    }

    const list = complications.map((c) => ({
      ...c,
      customerName: db.customers.find((cu) => cu.id === db.surgeries.find((s) => s.id === c.surgeryId)?.customerId)?.name,
      surgeryName: db.surgeries.find((s) => s.id === c.surgeryId)?.surgeryName,
      recordedByName: db.users.find((u) => u.id === c.recordedBy)?.name,
    }));

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取并发症列表失败：' + (error as Error).message,
    });
  }
};

export const createComplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { surgeryId, category, description, treatment, occurredAt } = req.body;

    if (!surgeryId || !category || !description || !occurredAt) {
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

    const complication: Complication = {
      id: createId('complications'),
      surgeryId: Number(surgeryId),
      category,
      description,
      treatment,
      occurredAt: new Date(occurredAt),
      recordedBy: req.user.id,
    };

    db.complications.push(complication);

    res.status(201).json({
      success: true,
      data: complication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建并发症记录失败：' + (error as Error).message,
    });
  }
};

export const updateComplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, description, treatment, occurredAt, resolvedAt } = req.body;

    const db = await getDb();
    const index = db.complications.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '并发症记录不存在',
      });
      return;
    }

    db.complications[index] = {
      ...db.complications[index],
      category: category || db.complications[index].category,
      description: description || db.complications[index].description,
      treatment: treatment !== undefined ? treatment : db.complications[index].treatment,
      occurredAt: occurredAt ? new Date(occurredAt) : db.complications[index].occurredAt,
      resolvedAt: resolvedAt ? new Date(resolvedAt) : db.complications[index].resolvedAt,
    };

    res.json({
      success: true,
      data: db.complications[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新并发症记录失败：' + (error as Error).message,
    });
  }
};

export const deleteComplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.complications.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '并发症记录不存在',
      });
      return;
    }

    db.complications.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除并发症记录失败：' + (error as Error).message,
    });
  }
};

export const getPhotoComparison = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, surgeryId } = req.params;
    const db = await getDb();

    const customer = db.customers.find((c) => c.id === Number(customerId));
    if (!customer) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    const preOpPhotos = db.photos.filter((p) => p.customerId === Number(customerId) && !p.postOpVisitId);
    const postOpPhotos = db.photos.filter((p) => p.customerId === Number(customerId) && p.postOpVisitId);

    let surgeryPostOpPhotos = postOpPhotos;
    if (surgeryId) {
      const visits = db.postOpVisits.filter((v) => v.surgeryId === Number(surgeryId));
      const visitIds = visits.map((v) => v.id);
      surgeryPostOpPhotos = postOpPhotos.filter((p) => p.postOpVisitId && visitIds.includes(p.postOpVisitId));
    }

    res.json({
      success: true,
      data: {
        preOpPhotos,
        postOpPhotos: surgeryPostOpPhotos,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取照片对比失败：' + (error as Error).message,
    });
  }
};

export const uploadPostOpPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { visitId } = req.params;
    const { type, angle, url, thumbnailUrl } = req.body;

    if (!type || !url) {
      res.status(400).json({
        success: false,
        error: '照片类型和URL不能为空',
      });
      return;
    }

    const db = await getDb();

    const visit = db.postOpVisits.find((v) => v.id === Number(visitId));
    if (!visit) {
      res.status(404).json({
        success: false,
        error: '回访记录不存在',
      });
      return;
    }

    const surgery = db.surgeries.find((s) => s.id === visit.surgeryId);
    if (!surgery) {
      res.status(404).json({
        success: false,
        error: '手术不存在',
      });
      return;
    }

    const photo: Photo = {
      id: createId('photos'),
      customerId: surgery.customerId,
      type,
      angle,
      url,
      thumbnailUrl: thumbnailUrl || url,
      postOpVisitId: Number(visitId),
      uploadedBy: req.user.id,
      createdAt: new Date(),
    };

    db.photos.push(photo);

    res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '上传术后照片失败：' + (error as Error).message,
    });
  }
};
