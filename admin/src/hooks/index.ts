import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import type { Meal, MealsResponse, SingleMealResponse, MealFormData, ImageUploadResponse } from '@/types';

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  assignedRiderId: string | null;
  sponsoredMealsCount: number;
  deliveryDetails: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  ordersToday: number;
  pendingOrders: number;
  preparingOrders: number;
  outForDelivery: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface BackendOrderStats {
  totalOrders?: number;
  ordersToday?: number;
  byMealStatus?: Partial<Record<'confirmed' | 'preparing' | 'outfordelivery' | 'delivered' | 'cancelled', number>>;
}

function mapOrderStats(backendStats: BackendOrderStats): OrderStats {
  return {
    totalOrders: backendStats.totalOrders || 0,
    ordersToday: backendStats.ordersToday || 0,
    pendingOrders: backendStats.byMealStatus?.confirmed || 0,
    preparingOrders: backendStats.byMealStatus?.preparing || 0,
    outForDelivery: backendStats.byMealStatus?.outfordelivery || 0,
    deliveredOrders: backendStats.byMealStatus?.delivered || 0,
    cancelledOrders: backendStats.byMealStatus?.cancelled || 0,
  };
}

export function useOrderStats() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (admin?.role !== 'admin') {
      setStats(null);
      setError(null);
      return;
    }

    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: BackendOrderStats }>('/api/orders/getOrderStats');
      setStats(mapOrderStats(res.data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load order statistics');
    }
  }, [admin?.role]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, error, fetchStats };
}

export interface DeliveryHistory {
  _id: string;
  status: 'assigned' | 'accepted' | 'pickedup' | 'delivered' | 'rejected' | 'cancelled';
  riderId: string;
  rider?: { name: string; phone: string };
  assignedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  releasedBy: 'rider' | 'admin' | null;
  photoUrl: string;
}

export interface OrderDetails {
  orderNumber: string;
  deliveries: DeliveryHistory[];
}

export interface KitchenOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    area: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  totalAmountInr: number;
  customerMealStatus: 'confirmed' | 'preparing' | 'readyforpickup';
  createdAt: string;
}

export function useMeals(kitchenId?: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (kitchenId === null) {
      setMeals([]);
      setError('Kitchen account is missing its kitchen ID. Sign out and sign in again.');
      setLoading(false);
      return;
    }

    try {
      const fetchPage = (page: number) => {
        const params = new URLSearchParams({ limit: '100', page: String(page) });
        if (kitchenId) params.set('kitchenId', kitchenId);
        return api.get<MealsResponse>(`/api/meals/getAllMeals?${params.toString()}`);
      };

      const firstPage = await fetchPage(1);
      const remainingPages = await Promise.all(
        Array.from(
          { length: Math.max(0, firstPage.pagination.totalPages - 1) },
          (_, index) => fetchPage(index + 2)
        )
      );
      setMeals([firstPage, ...remainingPages].flatMap((response) => response.data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [kitchenId]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const createMeal = async (data: MealFormData) => {
    const res = await api.post<SingleMealResponse>('/api/meals/createMeal', data);
    await fetchMeals();
    return res;
  };

  const updateMeal = async (id: string, data: Partial<MealFormData>) => {
    const res = await api.patch<SingleMealResponse>(`/api/meals/updateMealById/${id}`, data);
    await fetchMeals();
    return res;
  };

  const deleteMeal = async (id: string) => {
    await api.delete(`/api/meals/deleteMeal/${id}`);
    await fetchMeals();
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload<ImageUploadResponse>('/api/meals/upload-image', fd);
  };

  return { meals, loading, error, fetchMeals, createMeal, updateMeal, deleteMeal, uploadImage };
}

export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaidOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: KitchenOrder[] }>('/api/kitchen/getPaidOrders');
      setOrders(Array.isArray(res.data) ? res.data.map((order) => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : [],
      })) : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load kitchen orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaidOrders();
  }, [fetchPaidOrders]);

  const changeOrderStatus = async (orderId: string, action: 'startPreparing' | 'markReady') => {
    setError(null);
    try {
      await api.patch(`/api/kitchen/${action}/${orderId}`, {});
      await fetchPaidOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  return { orders, loading, error, fetchPaidOrders, changeOrderStatus };
}

export function useOrders() {
  const { admin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (query?: any) => {
    if (admin?.role !== 'admin') {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query?.status) params.append('customerMealStatus', query.status);
      if (query?.paymentStatus) params.append('paymentStatus', query.paymentStatus);
      if (query?.customerEmail) params.append('customerEmail', query.customerEmail);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());

      const path = params.toString() ? `/api/orders/getAllOrders?${params.toString()}` : '/api/orders/getAllOrders';
      const res = await api.get<{ success: boolean; data: any }>(path);

      const ordersData = res.data?.orders || res.data || [];
      const transformedOrders = ordersData.map((order: any) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: typeof order.deliveryAddress === 'string' ? order.deliveryAddress : JSON.stringify(order.deliveryAddress),
        items: order.items || [],
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        total: order.totalAmountInr || order.total || 0,
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'UPI',
        orderStatus: order.customerMealStatus || order.orderStatus || 'confirmed',
        assignedRiderId: order.assignedRiderId ? String(order.assignedRiderId) : null,
        sponsoredMealsCount: order.sponsoredMealsCount || 0,
        deliveryDetails: order.deliveryDetails || {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));

      setOrders(Array.isArray(transformedOrders) ? transformedOrders : []);
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [admin?.role]);

  const fetchStats = useCallback(async () => {
    if (admin?.role !== 'admin') {
      setStats(null);
      return;
    }

    try {
      const res = await api.get<{ success: boolean; data: BackendOrderStats }>('/api/orders/getOrderStats');
      setStats(mapOrderStats(res.data));
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order stats');
    }
  }, [admin?.role]);

  const fetchOrderDetails = async (orderId: string) => {
    if (admin?.role !== 'admin') throw new Error('Admin access is required to view order details.');
    const res = await api.get<{ success: boolean; data: OrderDetails }>(`/api/orders/getOrderById/${orderId}`);
    return res.data;
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const deleteOrderById = async (orderId: string) => {
    if (admin?.role !== 'admin') throw new Error('Admin access is required to delete orders.');
    await api.delete(`/api/orders/deleteOrder/${orderId}`);
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
    await fetchStats();
  };

  return {
    orders,
    stats,
    loading,
    error,
    fetchOrders,
    fetchStats,
    fetchOrderDetails,
    deleteOrder: deleteOrderById,
  };
}

export interface DeliveryRider {
  _id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  isBusy: boolean;
}

export function useDeliveryAssignments() {
  const { admin } = useAuth();
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    if (admin?.role !== 'admin') {
      setRiders([]);
      setError(null);
      return;
    }

    setError(null);
    try {
      const res = await api.get<{
        success: boolean;
        data: { riders: DeliveryRider[] };
      }>('/api/riders/getAllRiders?isActive=true&limit=100');
      setRiders(res.data.riders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load riders');
    }
  }, [admin?.role]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const assignRider = async (orderId: string, riderId: string) => {
    if (admin?.role !== 'admin') throw new Error('Admin access is required to assign riders.');
    await api.patch(`/api/orders/assignRider/${orderId}`, { riderId });
    await fetchRiders();
  };

  const unassignRider = async (orderId: string) => {
    if (admin?.role !== 'admin') throw new Error('Admin access is required to unassign riders.');
    await api.patch(`/api/orders/unassignRider/${orderId}`, {});
    await fetchRiders();
  };

  return { riders, error, fetchRiders, assignRider, unassignRider };
}
