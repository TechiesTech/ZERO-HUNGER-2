import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';
import {
  getCurrentUser,
  resendVerificationCode,
  sendPasswordResetCode,
  changePassword as requestChangePassword,
  signOut as requestSignOut,
  signIn as requestSignIn,
  signUp as requestSignUp,
  resetPassword as requestPasswordReset,
  verifyEmail as requestEmailVerification,
  type AuthUser,
} from '../services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  refreshUser: () => Promise<AuthUser | null>;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setAuthError(null);
        return null;
      }
      setAuthError(error instanceof Error ? error.message : 'Could not check your sign-in status.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser().catch(() => undefined);
  }, [refreshUser]);

  const signIn = async (identifier: string, password: string) => {
    const response = await requestSignIn(identifier, password);
    if (response.data?.codeRequired) return false;
    if (!response.data?.user) throw new Error(response.message || 'Sign in failed.');
    setUser(response.data.user);
    setAuthError(null);
    return true;
  };

  const signUp = async (name: string, email: string, password: string, phone?: string) => {
    await requestSignUp(name, email, password, phone);
  };

  const verifyEmail = async (email: string, code: string) => {
    const response = await requestEmailVerification(email, code);
    if (response.data?.pending) {
      throw new Error('Your registration is waiting for admin approval.');
    }
    if (!response.data?.user) throw new Error(response.message || 'Email verification failed.');
    setUser(response.data.user);
    setAuthError(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await requestChangePassword(currentPassword, newPassword);
    setUser(null);
    setAuthError(null);
  };

  const signOut = async () => {
    await requestSignOut();
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        refreshUser,
        signIn,
        signUp,
        verifyEmail,
        resendVerificationCode,
        sendPasswordResetCode,
        resetPassword: requestPasswordReset,
        changePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
