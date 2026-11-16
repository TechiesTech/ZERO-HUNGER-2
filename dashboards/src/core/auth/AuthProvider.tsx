import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@core/api/apiClient';
import type { AuthContextValue, AuthResponse, PortalRole, PortalUser } from '@core/auth/types';

interface BackendUser extends Omit<Partial<PortalUser>, 'role' | 'roles'> {
  role?: string;
  roles?: string[];
}

interface AuthPayload {
  user?: BackendUser;
}

function normalizeUser(value: BackendUser): PortalUser {
  const roles = value.roles ?? (value.role ? [value.role] : []);
  const role = roles.includes('admin') ? 'admin' : roles.includes('kitchen') ? 'kitchen' : roles[0];
  if (!value._id || !value.name || !role) {
    throw new Error('The server returned an invalid user profile.');
  }
  return {
    _id: value._id,
    name: value.name,
    email: value.email ?? '',
    phone: value.phone,
    role: role as PortalRole | string,
    roles,
    kitchenId: value.kitchenId,
    status: value.status,
    mustChangePassword: Boolean(value.mustChangePassword),
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get<AuthResponse<AuthPayload>>('/api/auth/me');
      const current = response.data?.user ? normalizeUser(response.data.user) : null;
      setUser(current);
      return current;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    const handleFocus = () => {
      void checkAuth().catch((error: unknown) => {
        console.error('Unable to refresh the authenticated session.', error);
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('focus', handleFocus);
    handleFocus();
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth]);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await api.post<AuthResponse<AuthPayload>>('/api/auth/login', {
      identifier: identifier.trim().toLowerCase(),
      password,
    });
    const loggedInUser = response.data?.user
      ? normalizeUser(response.data.user)
      : await checkAuth();
    if (!loggedInUser) {
      throw new Error(response.message || 'The server did not return an authenticated user.');
    }
    setUser(loggedInUser);
    return loggedInUser;
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post<AuthResponse<void>>('/api/auth/logout', {});
    } finally {
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post<AuthResponse<void>>('/api/auth/changePassword', {
        currentPassword,
        newPassword,
      });
      return response.message || 'Password changed successfully. Please log in again.';
    } finally {
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await api.post<AuthResponse<void>>('/api/auth/forgotPassword', {
      email: email.trim().toLowerCase(),
    });
    return response.message || 'A password reset code was sent to your email.';
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    const response = await api.post<AuthResponse<void>>('/api/auth/resetPassword', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    });
    return response.message || 'Password reset successfully. Please log in with your new password.';
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    checkAuth,
    changePassword,
    forgotPassword,
    resetPassword,
  }), [user, isLoading, login, logout, checkAuth, changePassword, forgotPassword, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
