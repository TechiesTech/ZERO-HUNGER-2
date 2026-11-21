import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { VerifyEmailScreen } from './VerifyEmailScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { riderService } from '../services/riderService';
import { hasRole } from '../types/rider';
import { useRiderContext } from '../context/RiderContext';

// Store session flag
const storeSession = () => localStorage.setItem('rider_session', 'true');

// Get stored online status
const getStoredOnlineStatus = () => localStorage.getItem('rider_online') === 'true';

type AuthMode = 'login' | 'register' | 'verifyEmail' | 'forgotPassword' | 'resetPassword';

export const AuthScreens: React.FC = () => {
  const { setUser, setIsOnline } = useRiderContext();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleLogin = async (identifier: string, password: string) => {
    const res = await riderService.login(identifier, password);
    const user = res?.user;

    if (!hasRole(user, 'rider')) {
      throw new Error('Access denied: This login is only for approved riders.');
    }

    storeSession();
    setUser(user);
    setIsOnline(getStoredOnlineStatus());
  };

  const handleRegisterSuccess = (email: string) => {
    setPendingEmail(email);
    setAuthMode('verifyEmail');
  };

  const handleEmailVerified = () => {
    setAuthMode('login');
  };

  const handleForgotPassword = (email: string) => {
    setPendingEmail(email);
    setAuthMode('resetPassword');
  };

  const handlePasswordReset = () => {
    setAuthMode('login');
  };

  if (authMode === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLogin}
        onSwitchToRegister={() => setAuthMode('register')}
        onForgotPassword={() => setAuthMode('forgotPassword')}
      />
    );
  }

  if (authMode === 'register') {
    return (
      <RegisterScreen
        onBackToLogin={() => setAuthMode('login')}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  if (authMode === 'verifyEmail') {
    return (
      <VerifyEmailScreen
        email={pendingEmail}
        onVerified={handleEmailVerified}
        onBack={() => setAuthMode('login')}
      />
    );
  }

  if (authMode === 'forgotPassword') {
    return (
      <ForgotPasswordScreen
        onBack={() => setAuthMode('login')}
        onCodeSent={handleForgotPassword}
      />
    );
  }

  if (authMode === 'resetPassword') {
    return (
      <ResetPasswordScreen
        email={pendingEmail}
        onBack={() => setAuthMode('forgotPassword')}
        onSuccess={handlePasswordReset}
      />
    );
  }

  return null;
};
