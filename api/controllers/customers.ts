import type { Response } from 'express';
import { getDb, createId } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Customer, Consultation, Photo, PaginatedResponse } from '../../shared/types.js';

export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, keyword } = req.query;

    let customers = [...db.customers];

    if (keyword) {
      const kw = String(keyword).toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.phone.includes(kw) ||
          (c.idCard && c.idCard.includes(kw))
      );
    }

    const total = customers.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = customers.slice(start, end);

    const result: PaginatedResponse<Customer> = {
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
      error: '获取顾客列表失败：' + (error as Error).message,
    });
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const customer = db.customers.find((c) => c.id === Number(id));

    if (!customer) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    const consultation = db.consultations.find((c) => c.customerId === customer.id);
    const photos = db.photos.filter((p) => p.customerId === customer.id);
    const surgeries = db.surgeries.filter((s) => s.customerId === customer.id);

    const customerWithDetails = {
      ...customer,
      consultation,
      photos,
      surgeries: surgeries.map((s) => ({
        ...s,
        consentForm: db.consentForms.find((cf) => cf.surgeryId === s.id),
        supplies: db.supplies.filter((sp) => sp.surgeryId === s.id),
        postOpVisits: db.postOpVisits.filter((v) => v.surgeryId === s.id),
        complications: db.complications.filter((c) => c.surgeryId === s.id),
      })),
    };

    res.json({
      success: true,
      data: customerWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取顾客详情失败：' + (error as Error).message,
    });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { name, gender, phone, idCard, birthday, contactAddress } = req.body;

    if (!name || !gender || !phone) {
      res.status(400).json({
        success: false,
        error: '姓名、性别和手机号不能为空',
      });
      return;
    }

    const db = await getDb();

    const existing = db.customers.find((c) => c.phone === phone);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '该手机号已被使用',
      });
      return;
    }

    const customer: Customer = {
      id: createId('customers'),
      name,
      gender,
      phone,
      idCard,
      birthday: birthday ? new Date(birthday) : undefined,
      contactAddress,
      photos: [],
      surgeries: [],
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    db.customers.push(customer);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建顾客失败：' + (error as Error).message,
    });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, gender, phone, idCard, birthday, contactAddress } = req.body;

    const db = await getDb();
    const index = db.customers.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    if (phone && phone !== db.customers[index].phone) {
      const existing = db.customers.find((c) => c.phone === phone && c.id !== Number(id));
      if (existing) {
        res.status(400).json({
          success: false,
          error: '该手机号已被使用',
        });
        return;
      }
    }

    db.customers[index] = {
      ...db.customers[index],
      name: name || db.customers[index].name,
      gender: gender || db.customers[index].gender,
      phone: phone || db.customers[index].phone,
      idCard: idCard !== undefined ? idCard : db.customers[index].idCard,
      birthday: birthday ? new Date(birthday) : db.customers[index].birthday,
      contactAddress: contactAddress !== undefined ? contactAddress : db.customers[index].contactAddress,
    };

    res.json({
      success: true,
      data: db.customers[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新顾客失败：' + (error as Error).message,
    });
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const index = db.customers.findIndex((c) => c.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    const surgeries = db.surgeries.filter((s) => s.customerId === Number(id));
    if (surgeries.length > 0) {
      res.status(400).json({
        success: false,
        error: '该顾客存在手术记录，无法删除',
      });
      return;
    }

    db.consultations = db.consultations.filter((c) => c.customerId !== Number(id));
    db.photos = db.photos.filter((p) => p.customerId !== Number(id));
    db.customers.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除顾客失败：' + (error as Error).message,
    });
  }
};

export const getConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const db = await getDb();

    const consultation = db.consultations.find((c) => c.customerId === Number(customerId));

    res.json({
      success: true,
      data: consultation || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取咨询记录失败：' + (error as Error).message,
    });
  }
};

export const createOrUpdateConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { customerId } = req.params;
    const { targetAreas, budgetRange, medicalHistory, consultationNotes } = req.body;

    const db = await getDb();

    const customer = db.customers.find((c) => c.id === Number(customerId));
    if (!customer) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    let consultation = db.consultations.find((c) => c.customerId === Number(customerId));

    if (consultation) {
      consultation.targetAreas = targetAreas || consultation.targetAreas;
      consultation.budgetRange = budgetRange || consultation.budgetRange;
      consultation.medicalHistory = medicalHistory !== undefined ? medicalHistory : consultation.medicalHistory;
      consultation.consultationNotes = consultationNotes || consultation.consultationNotes;
    } else {
      consultation = {
        id: createId('consultations'),
        customerId: Number(customerId),
        targetAreas: targetAreas || [],
        budgetRange: budgetRange || '',
        medicalHistory: medicalHistory || '',
        consultationNotes: consultationNotes || '',
        consultantId: req.user.id,
        createdAt: new Date(),
      } as Consultation;
      db.consultations.push(consultation);
    }

    res.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '保存咨询记录失败：' + (error as Error).message,
    });
  }
};

export const getPhotos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const db = await getDb();

    const photos = db.photos.filter((p) => p.customerId === Number(customerId));

    res.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取照片列表失败：' + (error as Error).message,
    });
  }
};

export const uploadPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const { customerId } = req.params;
    const { type, angle, url, thumbnailUrl } = req.body;

    if (!type || !url) {
      res.status(400).json({
        success: false,
        error: '照片类型和URL不能为空',
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

    const photo: Photo = {
      id: createId('photos'),
      customerId: Number(customerId),
      type,
      angle,
      url,
      thumbnailUrl: thumbnailUrl || url,
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
      error: '上传照片失败：' + (error as Error).message,
    });
  }
};

export const deletePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    const db = await getDb();

    const index = db.photos.findIndex((p) => p.id === Number(photoId));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '照片不存在',
      });
      return;
    }

    db.photos.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除照片失败：' + (error as Error).message,
    });
  }
};
