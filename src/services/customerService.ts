import apiClient from './api.ts';
import type { Customer, Consultation, Photo, ApiResponse, PaginatedResponse, PaginationParams, CustomerTag } from '../../shared/types.ts';

export interface CustomerListParams extends PaginationParams {
  tagIds?: string;
}

export const getCustomers = async (params: CustomerListParams): Promise<ApiResponse<PaginatedResponse<Customer>>> => {
  return apiClient.get('/customers', { params });
};

export const getCustomerById = async (id: number): Promise<ApiResponse<Customer>> => {
  return apiClient.get(`/customers/${id}`);
};

export const createCustomer = async (data: Partial<Customer> & { tagIds?: number[] }): Promise<ApiResponse<Customer>> => {
  return apiClient.post('/customers', data);
};

export const updateCustomer = async (id: number, data: Partial<Customer> & { tagIds?: number[] }): Promise<ApiResponse<Customer>> => {
  return apiClient.put(`/customers/${id}`, data);
};

export const deleteCustomer = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/customers/${id}`);
};

export const getTags = async (): Promise<ApiResponse<CustomerTag[]>> => {
  return apiClient.get('/customers/tags/list');
};

export const createTag = async (data: { name: string; color?: string; description?: string }): Promise<ApiResponse<CustomerTag>> => {
  return apiClient.post('/customers/tags', data);
};

export const updateTag = async (id: number, data: { name?: string; color?: string; description?: string }): Promise<ApiResponse<CustomerTag>> => {
  return apiClient.put(`/customers/tags/${id}`, data);
};

export const deleteTag = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/customers/tags/${id}`);
};

export const getTagStats = async (): Promise<ApiResponse<{ tagId: number; tagName: string; color: string; customerCount: number }[]>> => {
  return apiClient.get('/customers/tags/stats');
};

export const getCustomerTags = async (customerId: number): Promise<ApiResponse<CustomerTag[]>> => {
  return apiClient.get(`/customers/${customerId}/tags`);
};

export const updateCustomerTags = async (customerId: number, tagIds: number[]): Promise<ApiResponse<CustomerTag[]>> => {
  return apiClient.put(`/customers/${customerId}/tags`, { tagIds });
};

export const getCustomerConsultation = async (customerId: number): Promise<ApiResponse<Consultation>> => {
  return apiClient.get(`/customers/${customerId}/consultation`);
};

export const createConsultation = async (customerId: number, data: Partial<Consultation>): Promise<ApiResponse<Consultation>> => {
  return apiClient.post(`/customers/${customerId}/consultation`, data);
};

export const updateConsultation = async (customerId: number, data: Partial<Consultation>): Promise<ApiResponse<Consultation>> => {
  return apiClient.put(`/customers/${customerId}/consultation`, data);
};

export const getCustomerPhotos = async (customerId: number): Promise<ApiResponse<Photo[]>> => {
  return apiClient.get(`/customers/${customerId}/photos`);
};

export const uploadPhoto = async (customerId: number, data: { type: string; angle: string; url: string; thumbnailUrl?: string }): Promise<ApiResponse<Photo>> => {
  return apiClient.post(`/customers/${customerId}/photos`, data);
};

export const deletePhoto = async (photoId: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/customers/photos/${photoId}`);
};
