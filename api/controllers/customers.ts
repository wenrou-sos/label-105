import type { Response } from 'express';
import { getDb, createId } from '../utils/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Customer, Consultation, Photo, PaginatedResponse, CustomerTag, CustomerTagRelation } from '../../shared/types.js';

const getCustomerTagList = (db: Awaited<ReturnType<typeof getDb>>, customerId: number): CustomerTag[] => {
  const relationIds = db.customerTagRelations
    .filter((r) => r.customerId === customerId)
    .map((r) => r.tagId);
  return db.customerTags.filter((t) => relationIds.includes(t.id));
};

export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const { page = 1, pageSize = 10, keyword, tagIds } = req.query;

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

    if (tagIds) {
      const filterTagIds = String(tagIds)
        .split(',')
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));
      if (filterTagIds.length > 0) {
        customers = customers.filter((c) => {
          const customerTagIds = db.customerTagRelations
            .filter((r) => r.customerId === c.id)
            .map((r) => r.tagId);
          return filterTagIds.every((tid) => customerTagIds.includes(tid));
        });
      }
    }

    const total = customers.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const list = customers.slice(start, end).map((c) => ({
      ...c,
      tags: getCustomerTagList(db, c.id),
    }));

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
    const tags = getCustomerTagList(db, customer.id);
    const tagIds = tags.map((t) => t.id);

    const customerWithDetails = {
      ...customer,
      tagIds,
      tags,
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

    const { name, gender, phone, idCard, birthday, contactAddress, tagIds } = req.body;

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

    const customerId = createId('customers');
    const customer: Customer = {
      id: customerId,
      name,
      gender,
      phone,
      idCard,
      birthday: birthday ? new Date(birthday) : undefined,
      contactAddress,
      photos: [],
      surgeries: [],
      tagIds: tagIds || [],
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    db.customers.push(customer);

    if (tagIds && Array.isArray(tagIds)) {
      for (const tagId of tagIds) {
        const tag = db.customerTags.find((t) => t.id === tagId);
        if (tag) {
          const relation: CustomerTagRelation = {
            id: createId('customerTagRelations'),
            customerId,
            tagId,
            createdAt: new Date(),
          };
          db.customerTagRelations.push(relation);
        }
      }
    }

    const customerWithTags = {
      ...customer,
      tags: getCustomerTagList(db, customerId),
    };

    res.status(201).json({
      success: true,
      data: customerWithTags,
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
    const customerId = Number(id);
    const { name, gender, phone, idCard, birthday, contactAddress, tagIds } = req.body;

    const db = await getDb();
    const index = db.customers.findIndex((c) => c.id === customerId);

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    if (phone && phone !== db.customers[index].phone) {
      const existing = db.customers.find((c) => c.phone === phone && c.id !== customerId);
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
      tagIds: tagIds !== undefined ? tagIds : db.customers[index].tagIds,
    };

    if (tagIds !== undefined && Array.isArray(tagIds)) {
      db.customerTagRelations = db.customerTagRelations.filter((r) => r.customerId !== customerId);
      for (const tid of tagIds) {
        const tag = db.customerTags.find((t) => t.id === tid);
        if (tag) {
          const relation: CustomerTagRelation = {
            id: createId('customerTagRelations'),
            customerId,
            tagId: tid,
            createdAt: new Date(),
          };
          db.customerTagRelations.push(relation);
        }
      }
    }

    const customerWithTags = {
      ...db.customers[index],
      tags: getCustomerTagList(db, customerId),
    };

    res.json({
      success: true,
      data: customerWithTags,
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
    const customerId = Number(id);
    const db = await getDb();

    const index = db.customers.findIndex((c) => c.id === customerId);

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    const surgeries = db.surgeries.filter((s) => s.customerId === customerId);
    if (surgeries.length > 0) {
      res.status(400).json({
        success: false,
        error: '该顾客存在手术记录，无法删除',
      });
      return;
    }

    db.consultations = db.consultations.filter((c) => c.customerId !== customerId);
    db.photos = db.photos.filter((p) => p.customerId !== customerId);
    db.customerTagRelations = db.customerTagRelations.filter((r) => r.customerId !== customerId);
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

export const getTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    res.json({
      success: true,
      data: db.customerTags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取标签列表失败：' + (error as Error).message,
    });
  }
};

export const createTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, color, description } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: '标签名称不能为空',
      });
      return;
    }

    const db = await getDb();

    const existing = db.customerTags.find((t) => t.name === name);
    if (existing) {
      res.status(400).json({
        success: false,
        error: '该标签名称已存在',
      });
      return;
    }

    const tag: CustomerTag = {
      id: createId('customerTags'),
      name,
      color: color || 'blue',
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.customerTags.push(tag);

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建标签失败：' + (error as Error).message,
    });
  }
};

export const updateTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;

    const db = await getDb();
    const index = db.customerTags.findIndex((t) => t.id === Number(id));

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '标签不存在',
      });
      return;
    }

    if (name && name !== db.customerTags[index].name) {
      const existing = db.customerTags.find((t) => t.name === name && t.id !== Number(id));
      if (existing) {
        res.status(400).json({
          success: false,
          error: '该标签名称已存在',
        });
        return;
      }
    }

    db.customerTags[index] = {
      ...db.customerTags[index],
      name: name || db.customerTags[index].name,
      color: color || db.customerTags[index].color,
      description: description !== undefined ? description : db.customerTags[index].description,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      data: db.customerTags[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新标签失败：' + (error as Error).message,
    });
  }
};

export const deleteTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tagId = Number(id);
    const db = await getDb();

    const index = db.customerTags.findIndex((t) => t.id === tagId);

    if (index === -1) {
      res.status(404).json({
        success: false,
        error: '标签不存在',
      });
      return;
    }

    db.customerTagRelations = db.customerTagRelations.filter((r) => r.tagId !== tagId);
    db.customerTags.splice(index, 1);

    res.json({
      success: true,
      data: {
        message: '删除成功',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除标签失败：' + (error as Error).message,
    });
  }
};

export const getCustomerTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const db = await getDb();
    const tags = getCustomerTagList(db, Number(customerId));
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取客户标签失败：' + (error as Error).message,
    });
  }
};

export const updateCustomerTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { tagIds } = req.body;
    const cid = Number(customerId);
    const db = await getDb();

    const customer = db.customers.find((c) => c.id === cid);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: '顾客不存在',
      });
      return;
    }

    db.customerTagRelations = db.customerTagRelations.filter((r) => r.customerId !== cid);

    if (tagIds && Array.isArray(tagIds)) {
      for (const tid of tagIds) {
        const tag = db.customerTags.find((t) => t.id === tid);
        if (tag) {
          const relation: CustomerTagRelation = {
            id: createId('customerTagRelations'),
            customerId: cid,
            tagId: tid,
            createdAt: new Date(),
          };
          db.customerTagRelations.push(relation);
        }
      }
    }

    const customerIndex = db.customers.findIndex((c) => c.id === cid);
    if (customerIndex !== -1) {
      db.customers[customerIndex].tagIds = tagIds || [];
    }

    const tags = getCustomerTagList(db, cid);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新客户标签失败：' + (error as Error).message,
    });
  }
};

export const getTagStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const stats = db.customerTags.map((tag) => {
      const count = db.customerTagRelations.filter((r) => r.tagId === tag.id).length;
      return {
        tagId: tag.id,
        tagName: tag.name,
        color: tag.color,
        customerCount: count,
      };
    });
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取标签统计失败：' + (error as Error).message,
    });
  }
};
