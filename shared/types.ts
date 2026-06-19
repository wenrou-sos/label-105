export type UserRole = 'admin' | 'consultant' | 'doctor' | 'nurse';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  passwordHash?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'createdAt'>;
}

export interface Customer {
  id: number;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  idCard?: string;
  birthday?: Date;
  contactAddress?: string;
  consultation?: Consultation;
  photos: Photo[];
  surgeries: Surgery[];
  createdBy: number;
  createdAt: Date;
}

export type PhotoType = 'front' | 'side45' | 'side90' | 'postoperative';
export type PhotoAngle = 'front' | 'side45' | 'side90';

export interface Photo {
  id: number;
  customerId: number;
  type: PhotoType;
  angle?: PhotoAngle;
  url: string;
  thumbnailUrl: string;
  uploadedBy: number;
  postOpVisitId?: number;
  createdAt: Date;
}

export interface Consultation {
  id: number;
  customerId: number;
  targetAreas: string[];
  budgetRange: string;
  medicalHistory: string;
  consultationNotes: string;
  consultantId: number;
  createdAt: Date;
}

export type SurgeryStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AnesthesiaType = 'local' | 'general';

export interface Surgery {
  id: number;
  customerId: number;
  surgeryDate: Date;
  surgeonId: number;
  anesthesiaType: AnesthesiaType;
  surgeryName: string;
  status: SurgeryStatus;
  operationNotes?: string;
  consentForm?: ConsentForm;
  supplies: Supply[];
  postOpVisits: PostOpVisit[];
  complications: Complication[];
  createdAt: Date;
}

export interface ConsentForm {
  id: number;
  surgeryId: number;
  content: string;
  signature?: string;
  signedBy?: string;
  signedAt?: Date;
  witnessId?: number;
}

export type SupplyType = 'implant' | 'consumable' | 'medicine';

export interface Supply {
  id: number;
  surgeryId?: number;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: Date;
  type: SupplyType;
  isImplant: boolean;
  traceCode?: string;
  customerId?: number;
  usedAt: Date;
}

export type LevelType = 0 | 1 | 2 | 3;

export interface PostOpVisit {
  id: number;
  surgeryId: number;
  visitDate: Date;
  swellingLevel: LevelType;
  painLevel: LevelType;
  bruisingLevel: LevelType;
  sutureRemovalDate?: Date;
  notes: string;
  photos: Photo[];
  recordedBy: number;
}

export interface Complication {
  id: number;
  surgeryId: number;
  category: string;
  description: string;
  treatment?: string;
  occurredAt: Date;
  resolvedAt?: Date;
  recordedBy: number;
}

export type MedicineCategory = 'botulinum' | 'hyaluronic' | 'water_light' | 'other';

export interface Medicine {
  id: number;
  name: string;
  category: MedicineCategory;
  manufacturer: string;
  specifications: string;
  stock: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicineBatch {
  id: number;
  medicineId: number;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  receivedDate: Date;
  receivedBy: number;
  traceCodes: TraceCode[];
}

export type TraceCodeStatus = 'in_stock' | 'used' | 'expired' | 'returned';

export interface TraceCode {
  id: number;
  code: string;
  batchId: number;
  status: TraceCodeStatus;
  usedBy?: number;
  usedAt?: Date;
  customerId?: number;
  surgeryId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  permissions: string[];
  description: string;
}

export interface DashboardStats {
  todayConsultations: number;
  todaySurgeries: number;
  totalCustomers: number;
  totalRevenue: number;
  monthlyTrend: { date: string; value: number }[];
  surgeryDistribution: { name: string; value: number }[];
  areaDistribution: { name: string; value: number }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
