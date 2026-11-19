import { useState, useCallback, useEffect } from 'react';
import { riderService } from '../services/riderService';
import { useRiderContext } from '../context/RiderContext';
import type { AvailableOrder, ActiveDelivery } from '../types/rider';

// Constants
const POLL_INTERVAL = 12000; // 12 seconds

export const useOrders = () => {
  const { user, isOnline, activeDelivery, setAvailableOrders, setActiveDelivery } = useRiderContext();
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);

  // Fetch active delivery from API
  const checkActiveDelivery = useCallback(async () => {
    if (!user) return;

    try {
      const active = await riderService.currentDelivery();
      setActiveDelivery(active);
      if (active) {
        localStorage.setItem('rider_online', 'true');
      }
    } catch {
      setActiveDelivery(null);
    }
  }, [user, setActiveDelivery]);

  // Fetch available orders when idle
  const fetchAvailableOrders = useCallback(async () => {
    if (!user || !isOnline || activeDelivery) return;

    setIsRefreshingOrders(true);
    try {
      const orders = await riderService.getAvailableOrders();
      setAvailableOrders(orders);
    } catch (err: any) {
      console.warn('Could not load orders:', err.message);
    } finally {
      setIsRefreshingOrders(false);
    }
  }, [user, isOnline, activeDelivery, setAvailableOrders]);

  // Accept an order
  const acceptOrder = async (orderNumber: string) => {
    setIsDeliveryLoading(true);
    try {
      await riderService.acceptOrder(orderNumber);
      await checkActiveDelivery();
    } catch (err: any) {
      throw new Error(err.message || 'Could not accept order');
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  // Mark order as picked up
  const markPickedUp = async () => {
    if (!activeDelivery) return;

    setIsDeliveryLoading(true);
    try {
      await riderService.markPickedUp(activeDelivery.orderNumber);
      await checkActiveDelivery();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update status');
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  // Mark order as delivered with photo
  const markDelivered = async (photoFile: File) => {
    if (!activeDelivery) return;

    try {
      await riderService.markDelivered(activeDelivery.orderNumber, photoFile);
      setActiveDelivery(null);
      await fetchAvailableOrders();
    } catch (err: any) {
      throw new Error(err.message || 'Delivery upload failed');
    }
  };

  // Periodic polling when online
  useEffect(() => {
    if (!user || !isOnline) return;

    checkActiveDelivery();
    fetchAvailableOrders();

    const interval = setInterval(() => {
      checkActiveDelivery();
      if (!activeDelivery) {
        fetchAvailableOrders();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, isOnline, activeDelivery, checkActiveDelivery, fetchAvailableOrders]);

  return {
    isRefreshingOrders,
    isDeliveryLoading,
    fetchAvailableOrders,
    acceptOrder,
    markPickedUp,
    markDelivered,
  };
};
