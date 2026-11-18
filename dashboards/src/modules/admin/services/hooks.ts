import { useState, useEffect, useCallback } from 'react';
import { api } from './adminApi';
import { useAuth } from '@core/auth/useAuth';
import type { Meal, MealsResponse, SingleMealResponse, MealFormData, ImageUploadResponse } from '../types';

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
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

export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  ordersToday: number;
  pendingOrders: number;
  preparingOrders: number;
  readyForPickup: number;
  outForDelivery: number;
  deliveredOrders: number;
  cancelledOrders: number;
  successfulPayments: number;
  pendingPayments: number;
  readyForPickupOrders: number;
  failedPayments: number;
}

interface BackendOrderStats {
  totalOrders?: number;
  ordersToday?: number;
  byMealStatus?: Partial<Record<
    'confirmed' | 'preparing' | 'readyforpickup' | 'outfordelivery' | 'delivered' | 'cancelled',
    number
  >>;
  byPaymentStatus?: Partial<Record<'pending' | 'success' | 'failed', number>>;
}

function mapOrderStats(backendStats: BackendOrderStats): OrderStats {
  return {
    totalOrders: backendStats.totalOrders ?? 0,
    ordersToday: backendStats.ordersToday ?? 0,
    pendingOrders: backendStats.byMealStatus?.confirmed ?? 0,
    preparingOrders: backendStats.byMealStatus?.preparing ?? 0,
    readyForPickup: backendStats.byMealStatus?.readyforpickup ?? 0,
    readyForPickupOrders: backendStats.byMealStatus?.readyforpickup ?? 0,
    outForDelivery: backendStats.byMealStatus?.outfordelivery ?? 0,
    deliveredOrders: backendStats.byMealStatus?.delivered ?? 0,
    cancelledOrders: backendStats.byMealStatus?.cancelled ?? 0,
    pendingPayments: backendStats.byPaymentStatus?.pending ?? 0,
    successfulPayments: backendStats.byPaymentStatus?.success ?? 0,
    failedPayments: backendStats.byPaymentStatus?.failed ?? 0,
  };
}

interface BackendOrder {
  _id: string;
  orderNumber: string;
  customer?: { name?: string; email?: string; phone?: string };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string | {
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  totalAmountInr: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  items?: Order['items'];
  paymentStatus: string;
  paymentMethod: string;
  customerMealStatus: string;
  assignedRiderId?: string | null;
  sponsoredMealsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendOrdersResponse {
  success: boolean;
  data: {
    orders: BackendOrder[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

function formatOrderAddress(address: BackendOrder['deliveryAddress']): string {
  if (!address) return '';
  if (typeof address === 'string') return address;

  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
}

export function useOrderStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (user?.role !== 'admin') {
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
  }, [user?.role]);

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

export interface OrdersQuery {
  status?: string;
  paymentStatus?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
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

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<OrdersPagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (query: OrdersQuery = {}) => {
    if (user?.role !== 'admin') {
      setOrders([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.status) params.set('customerMealStatus', query.status);
      if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
      if (query.search) params.set('search', query.search);
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      params.set('page', String(query.page || 1));
      params.set('limit', String(query.limit || 10));

      const path = `/api/orders/getAllOrders?${params.toString()}`;
      const res = await api.get<BackendOrdersResponse>(path);

      const transformedOrders = res.data.orders.map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || order.customerName || 'Unknown customer',
        customerEmail: order.customer?.email || order.customerEmail || '',
        customerPhone: order.customer?.phone || order.customerPhone || '',
        deliveryAddress: formatOrderAddress(order.deliveryAddress),
        items: order.items || [],
        subtotal: order.subtotal ?? order.totalAmountInr,
        tax: order.tax ?? 0,
        total: order.totalAmountInr ?? order.total ?? 0,
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'UPI',
        orderStatus: order.customerMealStatus || 'confirmed',
        assignedRiderId: order.assignedRiderId ? String(order.assignedRiderId) : null,
        sponsoredMealsCount: order.sponsoredMealsCount,
        deliveryDetails: {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));

      setOrders(transformedOrders);
      setPagination(res.data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
      setPagination({ page: query.page || 1, limit: query.limit || 10, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const fetchStats = useCallback(async () => {
    if (user?.role !== 'admin') {
      setStats(null);
      return;
    }

    try {
      const res = await api.get<{ success: boolean; data: BackendOrderStats }>('/api/orders/getOrderStats');
      setStats(mapOrderStats(res.data));
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order stats');
    }
  }, [user?.role]);

  const fetchOrderDetails = async (orderId: string) => {
    if (user?.role !== 'admin') throw new Error('Admin access is required to view order details.');
    const res = await api.get<{ success: boolean; data: OrderDetails }>(`/api/orders/getOrderById/${orderId}`);
    return res.data;
  };

  useEffect(() => {
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const deleteOrderById = async (orderId: string) => {
    if (user?.role !== 'admin') throw new Error('Admin access is required to delete orders.');
    await api.delete(`/api/orders/deleteOrder/${orderId}`);
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
    await fetchStats();
  };

  return {
    orders,
    pagination,
    stats,
    loading,
    error,
    fetchOrders,
    fetchStats,
    fetchOrderDetails,
    deleteOrderById,
  };
}

export interface DeliveryRider {
  userId: string;
  name: string;
  phone: string;
  status: string;
  isLive: boolean;
  isBusy: boolean;
}

export function useDeliveryAssignments() {
  const { user } = useAuth();
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    if (user?.role !== 'admin') {
      setRiders([]);
      setError(null);
      return;
    }

    setError(null);
    try {
      const res = await api.get<{
        success: boolean;
        data: { riders: DeliveryRider[] };
      }>('/api/riders/getAllRiders?status=active&limit=50');
      setRiders(res.data.riders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load riders');
    }
  }, [user?.role]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const assignRider = async (orderId: string, riderId: string) => {
    if (user?.role !== 'admin') throw new Error('Admin access is required to assign riders.');
    await api.patch(`/api/orders/assignRider/${orderId}`, { riderId });
    await fetchRiders();
  };

  const unassignRider = async (orderId: string) => {
    if (user?.role !== 'admin') throw new Error('Admin access is required to unassign riders.');
    await api.patch(`/api/orders/unassignRider/${orderId}`, {});
    await fetchRiders();
  };

  return { riders, error, fetchRiders, assignRider, unassignRider };
}
