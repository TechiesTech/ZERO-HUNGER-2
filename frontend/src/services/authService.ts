import { api } from './apiClient';

export interface AuthUser {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: AuthUser;
    codeRequired?: boolean;
    pending?: boolean;
  };
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthResponse>('/api/auth/me');
  if (!response.data?.user) throw new Error('The server did not return the signed-in user.');
  return response.data.user;
}

export async function signIn(identifier: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/login', { identifier, password });
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<void> {
  await api.post<AuthResponse>('/api/auth/register', {
    name,
    email,
    ...(phone ? { phone } : {}),
    password,
  });
}

export async function verifyEmail(email: string, code: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/api/auth/verifyEmail', { email, code });
}

export async function resendVerificationCode(email: string): Promise<void> {
  await api.post<AuthResponse>('/api/auth/resendCode', { email });
}

export async function sendPasswordResetCode(email: string): Promise<void> {
  await api.post<AuthResponse>('/api/auth/forgotPassword', { email });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await api.post<AuthResponse>('/api/auth/resetPassword', { email, code, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post<AuthResponse>('/api/auth/changePassword', { currentPassword, newPassword });
}

export async function signOut(): Promise<void> {
  await api.post<AuthResponse>('/api/auth/logout', undefined);
}
