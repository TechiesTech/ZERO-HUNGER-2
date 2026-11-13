/**
 * admin/src/services/adminApi.ts
 * Unified API client for admin dashboard
 */

import { API_URL } from '../config';
import type { AdminUser, AuthResponse, LoginResponseData, GetMeResponseData } from '../types';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `Request failed (${res.status})`);
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? `Upload failed (${res.status})`);
    return json as T;
  },
};

export const authApi = {
  /**
   * 1. Admin Login
   * POST /api/auth/login
   * Body: { identifier, password }
   * Sets token httpOnly cookie
   */
  login: (identifier: string, password: string) =>
    api.post<AuthResponse<LoginResponseData>>('/api/auth/login', {
      identifier: identifier.trim().toLowerCase(),
      password,
    }),

  /**
   * 2. Check Admin Session (Get Profile)
   * GET /api/auth/me
   */
  getMe: () =>
    api.get<AuthResponse<GetMeResponseData>>('/api/auth/me'),

  /**
   * 3. Change Password (While Logged In)
   * POST /api/auth/changePassword
   * Body: { currentPassword, newPassword }
   */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<AuthResponse<void>>('/api/auth/changePassword', {
      currentPassword,
      newPassword,
    }),

  /**
   * 4. Forgot Password (Request OTP)
   * POST /api/auth/forgotPassword
   * Body: { email }
   */
  forgotPassword: (email: string) =>
    api.post<AuthResponse<void>>('/api/auth/forgotPassword', {
      email: email.trim().toLowerCase(),
    }),

  /**
   * 5. Reset Password (Submit OTP)
   * POST /api/auth/resetPassword
   * Body: { email, code, newPassword }
   */
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<AuthResponse<void>>('/api/auth/resetPassword', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    }),

  /**
   * 6. Admin Logout
   * POST /api/auth/logout
   * Clears token cookie
   */
  logout: () =>
    api.post<AuthResponse<void>>('/api/auth/logout', {}),
};
