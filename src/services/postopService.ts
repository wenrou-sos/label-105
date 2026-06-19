import apiClient from './api.ts';
import type {
  PostOpVisit,
  Complication,
  Photo,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../../shared/types.ts';

export const getPostOpVisits = async (
  params: PaginationParams & { surgeryId?: number }
): Promise<ApiResponse<PaginatedResponse<PostOpVisit & { customerName?: string; surgeryName?: string; recordedByName?: string }>>> => {
  return apiClient.get('/postop-visits', { params });
};

export const getPostOpVisitById = async (
  id: number
): Promise<ApiResponse<PostOpVisit & { customerName?: string; surgeryName?: string; recordedByName?: string; photos: Photo[] }>> => {
  return apiClient.get(`/postop-visits/${id}`);
};

export const createPostOpVisit = async (
  data: Partial<PostOpVisit> | Record<string, any>
): Promise<ApiResponse<PostOpVisit>> => {
  return apiClient.post('/postop-visits', data);
};

export const updatePostOpVisit = async (
  id: number,
  data: Partial<PostOpVisit> | Record<string, any>
): Promise<ApiResponse<PostOpVisit>> => {
  return apiClient.put(`/postop-visits/${id}`, data);
};

export const deletePostOpVisit = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/postop-visits/${id}`);
};

export const getComplications = async (
  surgeryId?: number
): Promise<ApiResponse<Complication[]>> => {
  const url = surgeryId ? `/surgeries/${surgeryId}/complications` : '/complications';
  return apiClient.get(url);
};

export const createComplication = async (
  surgeryId: number,
  data: Partial<Complication> | Record<string, any>
): Promise<ApiResponse<Complication>> => {
  return apiClient.post(`/surgeries/${surgeryId}/complications`, data);
};

export const updateComplication = async (
  id: number,
  data: Partial<Complication> | Record<string, any>
): Promise<ApiResponse<Complication>> => {
  return apiClient.put(`/complications/${id}`, data);
};

export const deleteComplication = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/complications/${id}`);
};

export const getPhotoComparison = async (
  customerId: number,
  surgeryId?: number
): Promise<ApiResponse<{ preOpPhotos: Photo[]; postOpPhotos: Photo[] }>> => {
  const url = surgeryId
    ? `/customers/${customerId}/photo-comparison?surgeryId=${surgeryId}`
    : `/customers/${customerId}/photo-comparison`;
  return apiClient.get(url);
};

export const uploadPostOpPhoto = async (
  visitId: number,
  data: Partial<Photo>
): Promise<ApiResponse<Photo>> => {
  return apiClient.post(`/postop-visits/${visitId}/photos`, data);
};
