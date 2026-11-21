import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { RiderUser, AvailableOrder, ActiveDelivery } from '../types/rider';

interface RiderContextType {
  user: RiderUser | null;
  setUser: (user: RiderUser | null) => void;
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  availableOrders: AvailableOrder[];
  setAvailableOrders: (orders: AvailableOrder[]) => void;
  activeDelivery: ActiveDelivery | null;
  setActiveDelivery: (delivery: ActiveDelivery | null) => void;
  bannerMessage: { type: 'warning' | 'error' | 'info'; message: string } | null;
  setBannerMessage: (message: { type: 'warning' | 'error' | 'info'; message: string } | null) => void;
}

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RiderUser | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rider_online') === 'true';
    } catch {
      return false;
    }
  });
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  return (
    <RiderContext.Provider
      value={{
        user,
        setUser,
        isOnline,
        setIsOnline,
        availableOrders,
        setAvailableOrders,
        activeDelivery,
        setActiveDelivery,
        bannerMessage,
        setBannerMessage,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export const useRiderContext = () => {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRiderContext must be used within RiderProvider');
  }
  return context;
};
