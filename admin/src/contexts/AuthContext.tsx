import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/adminApi';
import type { AdminUser } from '@/types';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await authApi.getMe();
      const user = response.data?.user ?? (response.data as unknown as AdminUser);
      setAdmin(user ?? null);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void checkAuth();
    const handleFocus = () => {
      void checkAuth();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    if (res.data?.user) {
      setAdmin(res.data.user);
    } else {
      await checkAuth();
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAdmin(null);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await authApi.changePassword(currentPassword, newPassword);
    // Backend clears token cookie on password change
    setAdmin(null);
    return res.message ?? 'Password changed successfully. Please log in again.';
  };

  const forgotPassword = async (email: string) => {
    const res = await authApi.forgotPassword(email);
    return res.message ?? 'A 6-digit password reset code was sent to your email.';
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const res = await authApi.resetPassword(email, code, newPassword);
    return res.message ?? 'Password reset successfully. Please log in with your new password.';
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        checkAuth,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
