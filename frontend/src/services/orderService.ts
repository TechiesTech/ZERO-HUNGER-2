/**
 * frontend/src/services/orderService.ts
 * Unified orders API
 */

import { api } from './apiClient';

export interface OrderItem {
  mealId: string;
  quantity: number;
  productName?: string;
  unitPriceInr?: number;
  totalPriceInr?: number;
}

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DeliveryPoint {
  latitude: number;
  longitude: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  deliveryLocation?: DeliveryPoint;
  items: OrderItem[];
  totalAmountInr: number;
  paymentStatus: string;
  paymentMethod: string;
  customerMealStatus: string;
  sponsoredMealsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  deliveryLocation: DeliveryPoint;
  paymentMethod: 'upi' | 'card' | 'netbanking';
  items: Array<{ mealId: string; quantity: number }>;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order & {
    customerPhone: string;
    deliveryAddress: DeliveryAddress;
  };
}

export async function createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
  return api.post<OrderResponse>('/api/orders/createOrder', orderData);
}

export async function reverseGeocode(
  point: DeliveryPoint
): Promise<{
  success: boolean;
  data: {
    address: (Partial<DeliveryAddress> & { formatted: string }) | null;
  };
}> {
  return api.post('/api/orders/reverseGeocode', point);
}

export async function trackOrder(orderNumber: string, customerEmail: string): Promise<Order> {
  const response = await api.post<{ success: boolean; data: Order }>('/api/orders/trackOrder', {
    orderNumber: orderNumber.trim().toUpperCase(),
    customerEmail: customerEmail.trim().toLowerCase(),
  });
  return response.data;
}

export interface OrderLookup {
  orderNumber: string;
  customerEmail: string;
}

export async function trackMyOrders(orders: OrderLookup[]): Promise<{ success: boolean; data: Order[] }> {
  return api.post('/api/orders/trackMyOrders', {
    orders: orders.map(({ orderNumber, customerEmail }) => ({
      orderNumber: orderNumber.trim().toUpperCase(),
      customerEmail: customerEmail.trim().toLowerCase(),
    })),
  });
}

export async function updateDeliveryDetails(
  orderNumber: string,
  customerEmail: string,
  deliveryDetails: {
    customerPhone?: string;
    deliveryAddress?: DeliveryAddress;
    deliveryLocation?: { latitude: number; longitude: number };
  }
): Promise<{ success: boolean; message: string; data: Partial<Order> }> {
  return api.patch('/api/orders/updateDeliveryDetails', {
    orderNumber: orderNumber.trim().toUpperCase(),
    customerEmail: customerEmail.trim().toLowerCase(),
    ...deliveryDetails,
  });
}

export async function cancelOrder(
  orderNumber: string,
  customerEmail: string
): Promise<{ success: boolean; message: string; data: { orderNumber: string; customerMealStatus: string } }> {
  return api.patch('/api/orders/cancelOrder', {
    orderNumber: orderNumber.trim().toUpperCase(),
    customerEmail: customerEmail.trim().toLowerCase(),
  });
}
