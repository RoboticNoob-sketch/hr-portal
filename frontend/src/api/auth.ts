import { apiClient } from '@/services/apiClient';
import type { ApiResponse, LoginResponse } from '@/types';

export const authApi = {
  login: (email: string, password: string, rememberMe = false) =>
    apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password, rememberMe }),

  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse>('/api/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/api/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string, confirmPassword: string) =>
    apiClient.post<ApiResponse>('/api/auth/reset-password', { token, newPassword, confirmPassword }),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    apiClient.post<ApiResponse>('/api/auth/change-password', { currentPassword, newPassword, confirmPassword }),
};
