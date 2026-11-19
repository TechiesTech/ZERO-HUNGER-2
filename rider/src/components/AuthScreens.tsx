import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { riderService } from '../services/riderService';
import { hasRole } from '../types/rider';
import { useRiderContext } from '../context/RiderContext';

// Store session flag
const storeSession = () => localStorage.setItem('rider_session', 'true');

// Get stored online status
const getStoredOnlineStatus = () => localStorage.getItem('rider_online') === 'true';

export const AuthScreens: React.FC = () => {
  const { setUser, setIsOnline } = useRiderContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  if (authMode === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLogin}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    );
  }

  return <RegisterScreen onBackToLogin={() => setAuthMode('login')} />;
};
