/**
 * frontend/src/services/orderService.ts
 * Unified orders API
 */

import { api } from './apiClient';

export interface OrderItem {
  mealId: string;
  mealName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  sponsoredMealsCount: number;
  deliveryDetails: {
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    deliveryNotes?: string;
    riderId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';
  items: OrderItem[];
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export async function createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
  return api.post<OrderResponse>('/api/orders/createOrder', orderData);
}

export async function trackOrder(orderNumber: string): Promise<Order> {
  const response = await api.post<{ success: boolean; data: Order }>('/api/orders/trackOrder', { orderNumber, customerEmail: 'test@example.com' });
  return response.data;
}

export async function trackMyOrders(customerEmail: string, page = 1, limit = 20): Promise<{ success: boolean; data: Order[] }> {
  return api.post('/api/orders/trackMyOrders', { orders: [{ orderNumber: 'ORD-123', customerEmail }] });
}

export async function updateDeliveryDetails(
  orderId: string,
  deliveryDetails: {
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    deliveryNotes?: string;
    riderId?: string;
  }
): Promise<OrderResponse> {
  return api.patch<OrderResponse>('/api/orders/updateDeliveryDetails', { orderId, ...deliveryDetails });
}

export async function cancelOrder(orderId: string, cancellationReason: string): Promise<OrderResponse> {
  return api.patch<OrderResponse>('/api/orders/cancelOrder', { orderId, cancellationReason });
}
