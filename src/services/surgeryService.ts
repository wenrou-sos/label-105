import apiClient from './api.ts';
import type {
  Surgery,
  Supply,
  PostOpVisit,
  Complication,
  ConsentForm,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../../shared/types.ts';

export const getSurgeries = async (params: PaginationParams): Promise<ApiResponse<PaginatedResponse<Surgery>>> => {
  return apiClient.get('/surgeries', { params });
};

export const getSurgeryById = async (id: number): Promise<ApiResponse<Surgery>> => {
  return apiClient.get(`/surgeries/${id}`);
};

export const getSurgeriesByCustomerId = async (customerId: number): Promise<ApiResponse<Surgery[]>> => {
  return apiClient.get(`/customers/${customerId}/surgeries`);
};

export const createSurgery = async (customerId: number, data: Partial<Surgery>): Promise<ApiResponse<Surgery>> => {
  return apiClient.post('/surgeries', { customerId, ...data });
};

export const updateSurgery = async (id: number, data: Partial<Surgery>): Promise<ApiResponse<Surgery>> => {
  return apiClient.put(`/surgeries/${id}`, data);
};

export const deleteSurgery = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/surgeries/${id}`);
};

export const updateSurgeryStatus = async (id: number, status: string): Promise<ApiResponse<Surgery>> => {
  return apiClient.patch(`/surgeries/${id}/status`, { status });
};

export const getSurgerySupplies = async (surgeryId: number): Promise<ApiResponse<Supply[]>> => {
  return apiClient.get(`/surgeries/${surgeryId}/supplies`);
};

export const addSupply = async (surgeryId: number, data: Partial<Supply>): Promise<ApiResponse<Supply>> => {
  return apiClient.post(`/surgeries/${surgeryId}/supplies`, data);
};

export const removeSupply = async (supplyId: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/supplies/${supplyId}`);
};

export const getPostOpVisits = async (surgeryId: number): Promise<ApiResponse<PostOpVisit[]>> => {
  return apiClient.get(`/surgeries/${surgeryId}/postop-visits`);
};

export const createPostOpVisit = async (surgeryId: number, data: Partial<PostOpVisit>): Promise<ApiResponse<PostOpVisit>> => {
  return apiClient.post(`/surgeries/${surgeryId}/postop-visits`, data);
};

export const updatePostOpVisit = async (id: number, data: Partial<PostOpVisit>): Promise<ApiResponse<PostOpVisit>> => {
  return apiClient.put(`/postop-visits/${id}`, data);
};

export const getComplications = async (surgeryId: number): Promise<ApiResponse<Complication[]>> => {
  return apiClient.get(`/surgeries/${surgeryId}/complications`);
};

export const createComplication = async (surgeryId: number, data: Partial<Complication>): Promise<ApiResponse<Complication>> => {
  return apiClient.post(`/surgeries/${surgeryId}/complications`, data);
};

export const updateComplication = async (id: number, data: Partial<Complication>): Promise<ApiResponse<Complication>> => {
  return apiClient.put(`/complications/${id}`, data);
};

export const getConsentForm = async (surgeryId: number): Promise<ApiResponse<ConsentForm>> => {
  return apiClient.get(`/surgeries/${surgeryId}/consent-form`);
};

export const createConsentForm = async (surgeryId: number, data: Partial<ConsentForm>): Promise<ApiResponse<ConsentForm>> => {
  return apiClient.post(`/surgeries/${surgeryId}/consent-form`, data);
};

export const signConsentForm = async (id: number, signature: string, signedBy: string): Promise<ApiResponse<ConsentForm>> => {
  return apiClient.patch(`/consent-forms/${id}/sign`, { signature, signedBy });
};
