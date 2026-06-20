import bcrypt from 'bcryptjs';
import type {
  User, Customer, Consultation, Photo, Surgery, ConsentForm,
  Supply, PostOpVisit, Complication, Medicine, MedicineBatch,
  TraceCode, Role, UserRole, CustomerTag, CustomerTagRelation
} from '../../shared/types.js';

interface Database {
  roles: Role[];
  users: User[];
  customers: Customer[];
  customerTags: CustomerTag[];
  customerTagRelations: CustomerTagRelation[];
  consultations: Consultation[];
  photos: Photo[];
  surgeries: Surgery[];
  consentForms: ConsentForm[];
  supplies: Supply[];
  postOpVisits: PostOpVisit[];
  complications: Complication[];
  medicines: Medicine[];
  medicineBatches: MedicineBatch[];
  traceCodes: TraceCode[];
  counters: Record<string, number>;
}

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const createId = (type: string): number => {
  db.counters[type] = (db.counters[type] || 0) + 1;
  return db.counters[type];
};

const getSamplePhotoUrl = (type: string): string => {
  const photos: Record<string, string> = {
    front: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop',
    side45: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=500&fit=crop',
    side90: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
    postoperative: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=500&fit=crop',
  };
  return photos[type] || photos.front;
};

const initDb = async (): Promise<Database> => {
  const defaultPermissions: Record<UserRole, string[]> = {
    admin: ['*'],
    consultant: ['customer:read', 'customer:create', 'customer:update', 'consultation:*', 'photo:upload', 'photo:view', 'photo:delete'],
    doctor: ['customer:read', 'surgery:*', 'consent:*', 'supply:*', 'postop:*', 'photo:*'],
    nurse: ['customer:read', 'medicine:*', 'supply:read', 'postop:create', 'postop:update', 'photo:upload', 'photo:view', 'photo:delete'],
  };

  const roles: Role[] = [
    { id: 1, name: '系统管理员', code: 'admin', permissions: ['*'], description: '拥有系统所有权限' },
    { id: 2, name: '咨询师', code: 'consultant', permissions: defaultPermissions.consultant, description: '负责顾客咨询登记' },
    { id: 3, name: '医生', code: 'doctor', permissions: defaultPermissions.doctor, description: '负责手术和术后管理' },
    { id: 4, name: '护士', code: 'nurse', permissions: defaultPermissions.nurse, description: '负责药品管理和术后护理' },
  ];

  const users: User[] = [
    {
      id: 1,
      username: 'admin',
      name: '系统管理员',
      role: 'admin',
      permissions: ['*'],
      isActive: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      username: 'consultant1',
      name: '张咨询师',
      role: 'consultant',
      permissions: defaultPermissions.consultant,
      isActive: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 3,
      username: 'doctor1',
      name: '李医生',
      role: 'doctor',
      permissions: defaultPermissions.doctor,
      isActive: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 4,
      username: 'nurse1',
      name: '王护士',
      role: 'nurse',
      permissions: defaultPermissions.nurse,
      isActive: true,
      createdAt: new Date('2024-01-01'),
    },
  ];

  users[0].passwordHash = await hashPassword('admin123');
  users[1].passwordHash = await hashPassword('123456');
  users[2].passwordHash = await hashPassword('123456');
  users[3].passwordHash = await hashPassword('123456');

  const customers: Customer[] = [
    {
      id: 1,
      name: '刘女士',
      gender: 'female',
      phone: '13800138001',
      idCard: '110101199001011234',
      birthday: new Date('1990-01-15'),
      contactAddress: '北京市朝阳区',
      photos: [],
      surgeries: [],
      tagIds: [1, 2],
      createdBy: 2,
      createdAt: new Date('2024-03-01'),
    },
    {
      id: 2,
      name: '陈女士',
      gender: 'female',
      phone: '13800138002',
      idCard: '110101199202022345',
      birthday: new Date('1992-05-20'),
      contactAddress: '北京市海淀区',
      photos: [],
      surgeries: [],
      tagIds: [1, 3],
      createdBy: 2,
      createdAt: new Date('2024-03-05'),
    },
    {
      id: 3,
      name: '王女士',
      gender: 'female',
      phone: '13800138003',
      idCard: '110101198803033456',
      birthday: new Date('1988-08-10'),
      contactAddress: '北京市西城区',
      photos: [],
      surgeries: [],
      tagIds: [2],
      createdBy: 2,
      createdAt: new Date('2024-03-10'),
    },
  ];

  const customerTags: CustomerTag[] = [
    { id: 1, name: 'VIP', color: 'gold', description: '重要客户，享有优先服务', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 2, name: '高意向', color: 'red', description: '咨询后成交概率高', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 3, name: '复购客户', color: 'purple', description: '多次消费的老客户', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 4, name: '新客户', color: 'blue', description: '首次到店咨询', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 5, name: '待跟进', color: 'orange', description: '需要后续跟进联系', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 6, name: '投诉客户', color: 'gray', description: '有过投诉记录，需要特别处理', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  ];

  const customerTagRelations: CustomerTagRelation[] = [
    { id: 1, customerId: 1, tagId: 1, createdAt: new Date('2024-03-01') },
    { id: 2, customerId: 1, tagId: 2, createdAt: new Date('2024-03-01') },
    { id: 3, customerId: 2, tagId: 1, createdAt: new Date('2024-03-05') },
    { id: 4, customerId: 2, tagId: 3, createdAt: new Date('2024-03-05') },
    { id: 5, customerId: 3, tagId: 2, createdAt: new Date('2024-03-10') },
  ];

  const consultations: Consultation[] = [
    {
      id: 1,
      customerId: 1,
      targetAreas: ['eye', 'nose'],
      budgetRange: '50000-100000',
      medicalHistory: '无重大疾病史，无过敏史',
      consultationNotes: '<p>顾客希望改善眼部和鼻部形态，预算5-10万。已进行详细沟通，建议先做双眼皮手术，再考虑隆鼻。</p>',
      consultantId: 2,
      createdAt: new Date('2024-03-01'),
    },
    {
      id: 2,
      customerId: 2,
      targetAreas: ['chest'],
      budgetRange: '100000-200000',
      medicalHistory: '无特殊病史',
      consultationNotes: '<p>顾客希望进行隆胸手术，预算10-20万。已告知手术风险和术后注意事项。</p>',
      consultantId: 2,
      createdAt: new Date('2024-03-05'),
    },
  ];

  const photos: Photo[] = [
    { id: 1, customerId: 1, type: 'front', angle: 'front', url: getSamplePhotoUrl('front'), thumbnailUrl: getSamplePhotoUrl('front'), uploadedBy: 2, createdAt: new Date('2024-03-01') },
    { id: 2, customerId: 1, type: 'side45', angle: 'side45', url: getSamplePhotoUrl('side45'), thumbnailUrl: getSamplePhotoUrl('side45'), uploadedBy: 2, createdAt: new Date('2024-03-01') },
    { id: 3, customerId: 1, type: 'side90', angle: 'side90', url: getSamplePhotoUrl('side90'), thumbnailUrl: getSamplePhotoUrl('side90'), uploadedBy: 2, createdAt: new Date('2024-03-01') },
    { id: 4, customerId: 2, type: 'front', angle: 'front', url: getSamplePhotoUrl('front'), thumbnailUrl: getSamplePhotoUrl('front'), uploadedBy: 2, createdAt: new Date('2024-03-05') },
    { id: 5, customerId: 2, type: 'side45', angle: 'side45', url: getSamplePhotoUrl('side45'), thumbnailUrl: getSamplePhotoUrl('side45'), uploadedBy: 2, createdAt: new Date('2024-03-05') },
    { id: 6, customerId: 2, type: 'side90', angle: 'side90', url: getSamplePhotoUrl('side90'), thumbnailUrl: getSamplePhotoUrl('side90'), uploadedBy: 2, createdAt: new Date('2024-03-05') },
  ];

  const surgeries: Surgery[] = [
    {
      id: 1,
      customerId: 1,
      surgeryDate: new Date('2026-06-15T09:30:00'),
      surgeonId: 2,
      anesthesiaType: 'local',
      surgeryName: '全切双眼皮手术',
      status: 'completed',
      operationNotes: '手术顺利，双侧对称，出血量少',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-10'),
    },
    {
      id: 2,
      customerId: 2,
      surgeryDate: new Date('2026-06-20T14:00:00'),
      surgeonId: 2,
      anesthesiaType: 'general',
      surgeryName: '假体隆胸手术',
      status: 'scheduled',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-12'),
    },
    {
      id: 3,
      customerId: 3,
      surgeryDate: new Date('2026-06-20T10:00:00'),
      surgeonId: 3,
      anesthesiaType: 'local',
      surgeryName: '玻尿酸面部填充',
      status: 'in_progress',
      operationNotes: '填充额头、太阳穴、苹果肌',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-15'),
    },
    {
      id: 4,
      customerId: 1,
      surgeryDate: new Date('2026-06-22T15:30:00'),
      surgeonId: 2,
      anesthesiaType: 'local',
      surgeryName: '肉毒素除皱',
      status: 'scheduled',
      operationNotes: '眉间纹、鱼尾纹、抬头纹',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-18'),
    },
    {
      id: 5,
      customerId: 2,
      surgeryDate: new Date('2026-06-25T09:00:00'),
      surgeonId: 3,
      anesthesiaType: 'general',
      surgeryName: '腰腹环吸抽脂',
      status: 'scheduled',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-19'),
    },
    {
      id: 6,
      customerId: 3,
      surgeryDate: new Date('2026-06-30T14:30:00'),
      surgeonId: 2,
      anesthesiaType: 'local',
      surgeryName: '鼻综合整形',
      status: 'scheduled',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-19'),
    },
    {
      id: 7,
      customerId: 1,
      surgeryDate: new Date('2026-07-05T10:30:00'),
      surgeonId: 3,
      anesthesiaType: 'local',
      surgeryName: '光子嫩肤',
      status: 'scheduled',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-20'),
    },
    {
      id: 8,
      customerId: 2,
      surgeryDate: new Date('2026-07-10T13:00:00'),
      surgeonId: 2,
      anesthesiaType: 'local',
      surgeryName: '下颌缘提升',
      status: 'scheduled',
      supplies: [],
      postOpVisits: [],
      complications: [],
      createdAt: new Date('2026-06-20'),
    },
  ];

  const consentForms: ConsentForm[] = [
    {
      id: 1,
      surgeryId: 1,
      content: '双眼皮手术知情同意书\n\n一、手术名称：全切双眼皮手术\n二、手术目的：改善眼部外观，形成双眼皮\n三、手术可能存在的风险：\n1. 出血、感染\n2. 双侧不对称\n3. 瘢痕增生\n4. 上睑下垂\n...',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      signedBy: '刘女士',
      signedAt: new Date('2024-03-14'),
      witnessId: 4,
    },
  ];

  const supplies: Supply[] = [
    {
      id: 1,
      surgeryId: 1,
      name: '双眼皮缝合线',
      brand: '强生',
      batchNumber: 'BJ202401001',
      expiryDate: new Date('2026-12-31'),
      type: 'consumable',
      isImplant: false,
      traceCode: 'SC202401001001',
      customerId: 1,
      usedAt: new Date('2024-03-15'),
    },
    {
      id: 2,
      surgeryId: 2,
      name: '硅胶假体',
      brand: '曼托',
      batchNumber: 'MT202402001',
      expiryDate: new Date('2029-06-30'),
      type: 'implant',
      isImplant: true,
      traceCode: 'MT202402001001',
      customerId: 2,
      usedAt: new Date('2024-03-20'),
    },
  ];

  const postOpVisits: PostOpVisit[] = [
    {
      id: 1,
      surgeryId: 1,
      visitDate: new Date('2024-03-16'),
      swellingLevel: 2,
      painLevel: 1,
      bruisingLevel: 1,
      notes: '术后第一天，肿胀明显，疼痛可耐受，无异常分泌物',
      photos: [],
      recordedBy: 4,
    },
    {
      id: 2,
      surgeryId: 1,
      visitDate: new Date('2024-03-22'),
      swellingLevel: 1,
      painLevel: 0,
      bruisingLevel: 0,
      sutureRemovalDate: new Date('2024-03-22'),
      notes: '术后一周，肿胀消退良好，已拆线，伤口愈合佳',
      photos: [],
      recordedBy: 4,
    },
  ];

  const complications: Complication[] = [];

  const medicines: Medicine[] = [
    { id: 1, name: '衡力肉毒素', category: 'botulinum', manufacturer: '兰州衡力', specifications: '100U/支', stock: 5, unit: '支', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 2, name: '保妥适肉毒素', category: 'botulinum', manufacturer: '美国艾尔建', specifications: '100U/支', stock: 30, unit: '支', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 3, name: '乔雅登玻尿酸', category: 'hyaluronic', manufacturer: '美国艾尔建', specifications: '1ml/支', stock: 40, unit: '支', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 4, name: '润百颜玻尿酸', category: 'hyaluronic', manufacturer: '华熙生物', specifications: '1ml/支', stock: 60, unit: '支', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 5, name: '东国水光针', category: 'water_light', manufacturer: '韩国东国', specifications: '2.5ml/支', stock: 80, unit: '支', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  ];

  const medicineBatches: MedicineBatch[] = [
    {
      id: 1,
      medicineId: 1,
      batchNumber: 'HL202505001',
      expiryDate: new Date('2026-05-15'),
      quantity: 2,
      receivedDate: new Date('2024-01-15'),
      receivedBy: 4,
      traceCodes: [],
    },
    {
      id: 4,
      medicineId: 1,
      batchNumber: 'HL202606001',
      expiryDate: new Date('2026-06-20'),
      quantity: 5,
      receivedDate: new Date('2024-06-01'),
      receivedBy: 4,
      traceCodes: [],
    },
    {
      id: 2,
      medicineId: 1,
      batchNumber: 'HL202604001',
      expiryDate: new Date('2026-07-10'),
      quantity: 3,
      receivedDate: new Date('2024-04-10'),
      receivedBy: 4,
      traceCodes: [],
    },
    {
      id: 3,
      medicineId: 3,
      batchNumber: 'QYD202603001',
      expiryDate: new Date('2028-03-31'),
      quantity: 40,
      receivedDate: new Date('2024-02-10'),
      receivedBy: 4,
      traceCodes: [],
    },
  ];

  const traceCodes: TraceCode[] = [
    { id: 1, code: 'HL2025050010001', batchId: 1, status: 'in_stock', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
    { id: 2, code: 'HL2025050010002', batchId: 1, status: 'in_stock', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
    { id: 3, code: 'HL2025050010003', batchId: 1, status: 'used', usedBy: 3, usedAt: new Date('2024-03-10'), customerId: 3, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-03-10') },
    { id: 8, code: 'HL2026060010001', batchId: 4, status: 'in_stock', createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01') },
    { id: 9, code: 'HL2026060010002', batchId: 4, status: 'in_stock', createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01') },
    { id: 10, code: 'HL2026060010003', batchId: 4, status: 'in_stock', createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01') },
    { id: 4, code: 'HL2026040010001', batchId: 2, status: 'in_stock', createdAt: new Date('2024-04-10'), updatedAt: new Date('2024-04-10') },
    { id: 5, code: 'HL2026040010002', batchId: 2, status: 'in_stock', createdAt: new Date('2024-04-10'), updatedAt: new Date('2024-04-10') },
    { id: 6, code: 'HL2026040010003', batchId: 2, status: 'in_stock', createdAt: new Date('2024-04-10'), updatedAt: new Date('2024-04-10') },
    { id: 7, code: 'QYD2026030010001', batchId: 3, status: 'in_stock', createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-02-10') },
  ];

  medicineBatches[0].traceCodes = traceCodes.filter(t => t.batchId === 1);
  medicineBatches[1].traceCodes = traceCodes.filter(t => t.batchId === 4);
  medicineBatches[2].traceCodes = traceCodes.filter(t => t.batchId === 2);
  medicineBatches[3].traceCodes = traceCodes.filter(t => t.batchId === 3);

  customers[0].consultation = consultations[0];
  customers[0].photos = photos.filter(p => p.customerId === 1);
  customers[0].surgeries = surgeries.filter(s => s.customerId === 1);
  customers[1].consultation = consultations[1];
  customers[1].photos = photos.filter(p => p.customerId === 2);
  customers[1].surgeries = surgeries.filter(s => s.customerId === 2);

  surgeries[0].consentForm = consentForms[0];
  surgeries[0].supplies = supplies.filter(s => s.surgeryId === 1);
  surgeries[0].postOpVisits = postOpVisits.filter(v => v.surgeryId === 1);
  surgeries[1].supplies = supplies.filter(s => s.surgeryId === 2);

  return {
    roles,
    users,
    customers,
    customerTags,
    customerTagRelations,
    consultations,
    photos,
    surgeries,
    consentForms,
    supplies,
    postOpVisits,
    complications,
    medicines,
    medicineBatches,
    traceCodes,
    counters: {
      roles: 4,
      users: 4,
      customers: 3,
      customerTags: 6,
      customerTagRelations: 5,
      consultations: 2,
      photos: 6,
      surgeries: 8,
      consentForms: 1,
      supplies: 2,
      postOpVisits: 2,
      complications: 0,
      medicines: 5,
      medicineBatches: 4,
      traceCodes: 10,
    },
  };
};

let db: Database;

export const getDb = async (): Promise<Database> => {
  if (!db) {
    db = await initDb();
  }
  return db;
};

export { createId, hashPassword, getSamplePhotoUrl };
