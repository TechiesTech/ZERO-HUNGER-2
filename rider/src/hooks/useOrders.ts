import { useState, useCallback, useEffect, useRef } from 'react';
import { riderService } from '../services/riderService';
import { useRiderContext } from '../context/RiderContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import type { AvailableOrder, ActiveDelivery } from '../types/rider';

// Constants
const POLL_INTERVAL = 12000; // 12 seconds

export const useOrders = () => {
  const { user, isOnline, activeDelivery, availableOrders, setAvailableOrders, setActiveDelivery } = useRiderContext();
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);

  // Use refs to store latest functions to avoid dependency issues
  const checkActiveDeliveryRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const fetchAvailableOrdersRef = useRef<(() => Promise<void>) | undefined>(undefined);

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

  // Update refs with latest functions
  useEffect(() => {
    checkActiveDeliveryRef.current = checkActiveDelivery;
    fetchAvailableOrdersRef.current = fetchAvailableOrders;
  }, [checkActiveDelivery, fetchAvailableOrders]);

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

  // Release an order (before pickup)
  const releaseOrder = async (orderNumber: string) => {
    setIsDeliveryLoading(true);
    try {
      await riderService.releaseOrder(orderNumber);
      await checkActiveDelivery();
      await fetchAvailableOrders();
    } catch (err: any) {
      throw new Error(err.message || 'Could not release order');
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

  // Socket.IO real-time updates
  useEffect(() => {
    if (!user || !isOnline) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    const handleOrderReady = () => {
      console.log('[Socket] New order ready');
      fetchAvailableOrdersRef.current?.();
    };

    const handleOrderTaken = (data: { orderNumber: string }) => {
      console.log('[Socket] Order taken by another rider:', data.orderNumber);
      // Remove the order from available orders list
      const filteredOrders = availableOrders.filter((order) => order.orderNumber !== data.orderNumber);
      setAvailableOrders(filteredOrders);
    };

    const handleOrderStatus = (data: { orderNumber: string; status: string }) => {
      console.log('[Socket] Order status changed:', data);
      // Refresh active delivery if status changed
      checkActiveDeliveryRef.current?.();
    };

    socket.on('order-ready', handleOrderReady);
    socket.on('order-taken', handleOrderTaken);
    socket.on('order-status', handleOrderStatus);

    return () => {
      socket.off('order-ready', handleOrderReady);
      socket.off('order-taken', handleOrderTaken);
      socket.off('order-status', handleOrderStatus);
      disconnectSocket();
    };
  }, [user, isOnline, setAvailableOrders, availableOrders]); // Removed fetchAvailableOrders and checkActiveDelivery from deps

  // Periodic polling when online (fallback)
  useEffect(() => {
    if (!user || !isOnline) return;

    checkActiveDeliveryRef.current?.();
    fetchAvailableOrdersRef.current?.();

    const interval = setInterval(() => {
      checkActiveDeliveryRef.current?.();
      if (!activeDelivery) {
        fetchAvailableOrdersRef.current?.();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, isOnline, activeDelivery]); // Removed checkActiveDelivery and fetchAvailableOrders from deps

  return {
    isRefreshingOrders,
    isDeliveryLoading,
    fetchAvailableOrders,
    acceptOrder,
    releaseOrder,
    markPickedUp,
    markDelivered,
  };
};
