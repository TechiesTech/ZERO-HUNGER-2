export type PortalRole = 'admin' | 'kitchen' | 'rider' | 'customer';

export interface PortalUser {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: PortalRole | string;
  roles: string[];
  kitchenId?: string | null;
  status?: string;
  mustChangePassword: boolean;
}

export interface AuthResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthContextValue {
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<PortalUser>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<PortalUser | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<string>;
}
