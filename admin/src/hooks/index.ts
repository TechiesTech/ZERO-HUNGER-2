import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/adminApi';
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
  sponsoredMealsCount: number;
  deliveryDetails: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  outForDelivery: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSponsoredMeals: number;
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<MealsResponse>('/api/meals/getAllMeals');
      setMeals(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (query?: any) => {
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
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: any }>('/api/orders/getOrderStats');
      const backendStats = res.data;

      const transformedStats: OrderStats = {
        totalOrders: backendStats.totalOrders || 0,
        totalRevenue: 0,
        pendingOrders: backendStats.byMealStatus?.confirmed || 0,
        preparingOrders: backendStats.byMealStatus?.preparing || 0,
        outForDelivery: backendStats.byMealStatus?.outfordelivery || 0,
        deliveredOrders: backendStats.byMealStatus?.delivered || 0,
        cancelledOrders: backendStats.byMealStatus?.cancelled || 0,
        totalSponsoredMeals: 0,
      };

      setStats(transformedStats);
    } catch (err: any) {
      console.error('Failed to fetch order stats:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const updateStatus = async (orderId: string, status: string) => {
    const statusMap: Record<string, string> = {
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'out_for_delivery': 'outfordelivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    };
    const backendStatus = statusMap[status] || status;

    const payload: any = { customerMealStatus: backendStatus };
    if (backendStatus === 'outfordelivery') {
      payload.assignedRiderId = '507f1f77bcf86cd799439011';
    }

    const res = await api.patch<{ success: boolean; data: any }>(`/api/orders/updateOrderStatus/${orderId}`, payload);
    const updatedOrder = {
      _id: res.data._id,
      orderNumber: res.data.orderNumber,
      customerName: res.data.customerName,
      customerEmail: res.data.customerEmail,
      customerPhone: res.data.customerPhone,
      deliveryAddress: typeof res.data.deliveryAddress === 'string' ? res.data.deliveryAddress : JSON.stringify(res.data.deliveryAddress),
      items: res.data.items || [],
      subtotal: res.data.subtotal || 0,
      tax: res.data.tax || 0,
      total: res.data.totalAmountInr || res.data.total || 0,
      paymentStatus: res.data.paymentStatus || 'pending',
      paymentMethod: res.data.paymentMethod || 'UPI',
      orderStatus: res.data.customerMealStatus || res.data.orderStatus || 'confirmed',
      sponsoredMealsCount: res.data.sponsoredMealsCount || 0,
      deliveryDetails: res.data.deliveryDetails || {},
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
    };
    setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
    await fetchStats();
    return updatedOrder;
  };

  const deleteOrderById = async (orderId: string) => {
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
    updateStatus,
    deleteOrder: deleteOrderById,
  };
}
