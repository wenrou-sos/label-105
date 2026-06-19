import apiClient from './api.ts';
import type { User, Role, DashboardStats, ApiResponse, PaginatedResponse, PaginationParams } from '../../shared/types.ts';

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  return apiClient.get('/dashboard/stats');
};

export const getUsers = async (params: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
  return apiClient.get('/users', { params });
};

export const getUserById = async (id: number): Promise<ApiResponse<User>> => {
  return apiClient.get(`/users/${id}`);
};

export const createUser = async (data: Partial<User> & { password: string }): Promise<ApiResponse<User>> => {
  return apiClient.post('/users', data);
};

export const updateUser = async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
  return apiClient.put(`/users/${id}`, data);
};

export const deleteUser = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/users/${id}`);
};

export const updateUserPassword = async (id: number, oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
  return apiClient.patch(`/users/${id}/password`, { oldPassword, newPassword });
};

export const toggleUserStatus = async (id: number): Promise<ApiResponse<User>> => {
  return apiClient.patch(`/users/${id}/toggle-status`);
};

export const getRoles = async (): Promise<ApiResponse<Role[]>> => {
  return apiClient.get('/roles');
};

export const getRoleById = async (id: number): Promise<ApiResponse<Role>> => {
  return apiClient.get(`/roles/${id}`);
};

export const createRole = async (data: Partial<Role>): Promise<ApiResponse<Role>> => {
  return apiClient.post('/roles', data);
};

export const updateRole = async (id: number, data: Partial<Role>): Promise<ApiResponse<Role>> => {
  return apiClient.put(`/roles/${id}`, data);
};

export const deleteRole = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/roles/${id}`);
};

export const getAllPermissions = async (): Promise<ApiResponse<string[]>> => {
  return apiClient.get('/permissions');
};

export const uploadFile = async (formData: FormData): Promise<ApiResponse<{ url: string; filename: string }>> => {
  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const exportData = async (type: 'customers' | 'surgeries' | 'medicines', params?: Record<string, unknown>): Promise<Blob> => {
  return apiClient.get(`/export/${type}`, {
    params,
    responseType: 'blob',
  });
};

export const getSystemLogs = async (params: PaginationParams & { level?: string }): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
  return apiClient.get('/system/logs', { params });
};

export const getSystemHealth = async (): Promise<ApiResponse<{ status: string; timestamp: string; services: Record<string, string> }>> => {
  return apiClient.get('/system/health');
};
