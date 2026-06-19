import apiClient from './api.ts';
import type { Customer, Consultation, Photo, ApiResponse, PaginatedResponse, PaginationParams } from '../../shared/types.ts';

export const getCustomers = async (params: PaginationParams): Promise<ApiResponse<PaginatedResponse<Customer>>> => {
  return apiClient.get('/customers', { params });
};

export const getCustomerById = async (id: number): Promise<ApiResponse<Customer>> => {
  return apiClient.get(`/customers/${id}`);
};

export const createCustomer = async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
  return apiClient.post('/customers', data);
};

export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
  return apiClient.put(`/customers/${id}`, data);
};

export const deleteCustomer = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/customers/${id}`);
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

export const uploadPhoto = async (customerId: number, formData: FormData): Promise<ApiResponse<Photo>> => {
  return apiClient.post(`/customers/${customerId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deletePhoto = async (photoId: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/photos/${photoId}`);
};
