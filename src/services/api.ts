import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { LoginRequest, ApiResponse } from '../../shared/types.ts';

const getToken = (): string | null => {
  const authState = localStorage.getItem('auth-storage');
  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      return parsed.state?.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

const getClearAuth = (): (() => void) | null => {
  try {
    const { useAuthStore } = require('@/store/auth.ts');
    return useAuthStore.getState().clearAuth;
  } catch {
    return null;
  }
};

const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const clearAuth = getClearAuth();
      if (clearAuth) {
        clearAuth();
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const loginApi = async (credentials: LoginRequest): Promise<ApiResponse> => {
  return apiClient.post('/auth/login', credentials);
};

export const logoutApi = async (): Promise<ApiResponse> => {
  return apiClient.post('/auth/logout');
};

export const getCurrentUserApi = async (): Promise<ApiResponse> => {
  return apiClient.get('/auth/me');
};

export default apiClient;
