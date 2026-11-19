import { useState, useEffect } from 'react';
import { riderService } from '../services/riderService';
import { hasRole } from '../types/rider';
import { useRiderContext } from '../context/RiderContext';

// Check if user has active session
const hasActiveSession = () => localStorage.getItem('rider_session') === 'true';

// Get stored online status
const getStoredOnlineStatus = () => localStorage.getItem('rider_online') === 'true';

// Clear session storage
const clearSession = () => {
  localStorage.removeItem('rider_session');
  localStorage.removeItem('rider_online');
};

// Restore user's online status from API or storage
const restoreOnlineStatus = async (user: any, setIsOnline: (val: boolean) => void) => {
  const wasOnline = getStoredOnlineStatus();
  if (wasOnline) {
    setIsOnline(true);
    await riderService.setAvailability(true);
  } else if (user.isAvailable !== undefined) {
    setIsOnline(Boolean(user.isAvailable));
    localStorage.setItem('rider_online', String(Boolean(user.isAvailable)));
  }
};

export const useAuth = () => {
  const { user, setUser, setIsOnline } = useRiderContext();
  const [authChecking, setAuthChecking] = useState(true);

  const checkAuth = async () => {
    if (!hasActiveSession()) {
      setAuthChecking(false);
      return;
    }

    try {
      const res = await riderService.getMe();
      if (hasRole(res.user, 'rider')) {
        setUser(res.user);
        await restoreOnlineStatus(res.user, setIsOnline);
      }
    } catch {
      clearSession();
    } finally {
      setAuthChecking(false);
    }
  };

  const logout = async () => {
    await riderService.logout();
    setUser(null);
    setIsOnline(false);
    clearSession();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { user, authChecking, logout };
};
