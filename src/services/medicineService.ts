import apiClient from './api.ts';
import type {
  Medicine,
  MedicineBatch,
  TraceCode,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../../shared/types.ts';

export const getMedicines = async (params: PaginationParams): Promise<ApiResponse<PaginatedResponse<Medicine>>> => {
  return apiClient.get('/medicines', { params });
};

export const getMedicineById = async (id: number): Promise<ApiResponse<Medicine>> => {
  return apiClient.get(`/medicines/${id}`);
};

export const createMedicine = async (data: Partial<Medicine>): Promise<ApiResponse<Medicine>> => {
  return apiClient.post('/medicines', data);
};

export const updateMedicine = async (id: number, data: Partial<Medicine>): Promise<ApiResponse<Medicine>> => {
  return apiClient.put(`/medicines/${id}`, data);
};

export const deleteMedicine = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/medicines/${id}`);
};

export const getMedicineBatches = async (medicineId: number): Promise<ApiResponse<MedicineBatch[]>> => {
  return apiClient.get(`/medicines/${medicineId}/batches`);
};

export const createBatch = async (medicineId: number, data: Partial<MedicineBatch>): Promise<ApiResponse<MedicineBatch>> => {
  return apiClient.post(`/medicines/${medicineId}/batches`, data);
};

export const updateBatch = async (id: number, data: Partial<MedicineBatch>): Promise<ApiResponse<MedicineBatch>> => {
  return apiClient.put(`/batches/${id}`, data);
};

export const deleteBatch = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/batches/${id}`);
};

export const getTraceCodes = async (batchId: number): Promise<ApiResponse<TraceCode[]>> => {
  return apiClient.get(`/batches/${batchId}/trace-codes`);
};

export const addTraceCodes = async (batchId: number, codes: string[]): Promise<ApiResponse<TraceCode[]>> => {
  return apiClient.post(`/batches/${batchId}/trace-codes`, { codes });
};

export const updateTraceCodeStatus = async (id: number, status: string, data?: Partial<TraceCode>): Promise<ApiResponse<TraceCode>> => {
  return apiClient.patch(`/trace-codes/${id}/status`, { status, ...data });
};

export const getTraceCodeByCode = async (code: string): Promise<ApiResponse<TraceCode>> => {
  return apiClient.get(`/medicines/trace-codes/${encodeURIComponent(code)}`);
};

export const getLowStockMedicines = async (): Promise<ApiResponse<Medicine[]>> => {
  return apiClient.get('/medicines/low-stock');
};

export const getExpiringMedicines = async (days?: number): Promise<ApiResponse<MedicineBatch[]>> => {
  return apiClient.get('/medicines/expiring', { params: { days } });
};

export const scanInbound = async (code: string, batchId: number): Promise<ApiResponse<TraceCode>> => {
  return apiClient.post('/medicines/scan/inbound', { code, batchId });
};

export const scanOutbound = async (code: string, customerId: number, surgeryId?: number): Promise<ApiResponse<TraceCode>> => {
  return apiClient.post('/medicines/scan/outbound', { code, customerId, surgeryId });
};
