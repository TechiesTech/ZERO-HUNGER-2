import { useState } from 'react';
import { riderService } from '../services/riderService';
import { useRiderContext } from '../context/RiderContext';

// Store online status
const storeOnlineStatus = (isOnline: boolean) => {
  localStorage.setItem('rider_online', String(isOnline));
};

export const useOnlineToggle = () => {
  const { isOnline, setIsOnline, activeDelivery, setAvailableOrders, setBannerMessage } = useRiderContext();
  const [toggleLoading, setToggleLoading] = useState(false);

  const toggleOnline = async () => {
    if (activeDelivery) {
      setBannerMessage({
        type: 'warning',
        message: 'Cannot go offline while you have an active delivery!',
      });
      return;
    }

    setToggleLoading(true);
    setBannerMessage(null);

    try {
      const nextState = !isOnline;
      await riderService.setAvailability(nextState);
      setIsOnline(nextState);
      storeOnlineStatus(nextState);

      if (!nextState) {
        setAvailableOrders([]);
      }
    } catch (err: any) {
      setBannerMessage({ type: 'error', message: err.message || 'Failed to update online status' });
    } finally {
      setToggleLoading(false);
    }
  };

  return { toggleLoading, toggleOnline };
};
