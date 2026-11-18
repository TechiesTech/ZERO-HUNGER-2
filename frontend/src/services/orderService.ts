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
  canEditDetails?: boolean;
  canCancel?: boolean;
  statusTimestamps?: {
    preparingAt?: string | null;
    readyAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: 'upi' | 'card' | 'netbanking';
  items: Array<{ mealId: string; quantity: number }>;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    orderNumber: string;
    customerId?: string;
    addressId?: string;
    totalAmountInr: number;
    paymentStatus: string;
    paymentMethod: string;
    customerMealStatus: string;
    sponsoredMealsCount: number;
    items?: Array<{
      mealId: string;
      productName: string;
      quantity: number;
      unitPriceInr: number;
      totalPriceInr: number;
      sponsoredChildMeals: number;
    }>;
    createdAt: string;
  };
}

export interface CheckoutDetailAddress {
  _id?: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
  customerName?: string;
  customerPhone?: string;
  location?: DeliveryPoint | null;
}

export interface CheckoutDetailsResponse {
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  addresses: CheckoutDetailAddress[];
  defaultAddress: CheckoutDetailAddress | null;
}

export interface MyOrderSummary {
  _id: string;
  orderNumber: string;
  customerMealStatus: string;
  totalAmountInr: number;
  sponsoredMealsCount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  items?: OrderItem[];
  deliveryAddress?: DeliveryAddress;
}

export interface MyOrdersResponse {
  success: boolean;
  data: {
    orders: MyOrderSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

function readDeliveryPoint(value: unknown): DeliveryPoint | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const coordinates = value as Record<string, unknown>;
  const { latitude, longitude } = coordinates;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }
  return { latitude, longitude };
}

export async function createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
  return api.post<OrderResponse>('/api/orders/createOrder', orderData);
}

export async function getCheckoutDetails(): Promise<CheckoutDetailsResponse> {
  const response = await api.get<{ success: boolean; data: CheckoutDetailsResponse }>('/api/orders/checkoutDetails');
  return response.data;
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

const toOrderRecord = (payload: Partial<Order> & Record<string, unknown>, customerEmail?: string): Order => ({
  _id: payload?._id ?? payload?.orderNumber ?? '',
  orderNumber: payload?.orderNumber ?? '',
  customerName: typeof payload?.customerName === 'string' ? payload.customerName : '',
  customerEmail: customerEmail ?? (typeof payload?.customerEmail === 'string' ? payload.customerEmail : ''),
  customerPhone: typeof payload?.customerPhone === 'string' ? payload.customerPhone : '',
  deliveryAddress: payload?.deliveryAddress && typeof payload.deliveryAddress === 'object'
    ? payload.deliveryAddress as DeliveryAddress
    : undefined,
  deliveryLocation: readDeliveryPoint(payload?.destination) ?? readDeliveryPoint(payload?.deliveryLocation),
  items: Array.isArray(payload?.items) ? payload.items as OrderItem[] : [],
  totalAmountInr: Number(payload?.totalAmountInr ?? 0),
  paymentStatus: typeof payload?.paymentStatus === 'string' ? payload.paymentStatus : 'pending',
  paymentMethod: typeof payload?.paymentMethod === 'string' ? payload.paymentMethod : 'upi',
  customerMealStatus: typeof payload?.customerMealStatus === 'string' ? payload.customerMealStatus : 'confirmed',
  sponsoredMealsCount: Number(payload?.sponsoredMealsCount ?? 0),
  canEditDetails: typeof payload?.canEditDetails === 'boolean' ? payload.canEditDetails : undefined,
  canCancel: typeof payload?.canCancel === 'boolean' ? payload.canCancel : undefined,
  createdAt: typeof payload?.placedAt === 'string'
    ? payload.placedAt
    : typeof payload?.createdAt === 'string'
      ? payload.createdAt
      : new Date().toISOString(),
  updatedAt: typeof payload?.updatedAt === 'string'
    ? payload.updatedAt
    : typeof payload?.placedAt === 'string'
      ? payload.placedAt
      : new Date().toISOString(),
});

export async function trackOrder(orderNumber: string, customerEmail?: string): Promise<Order> {
  const response = await api.get<{ success: boolean; data: Partial<Order> & Record<string, unknown> }>(`/api/orders/trackLiveOrder/${encodeURIComponent(orderNumber.trim().toUpperCase())}`);
  return toOrderRecord(response.data, customerEmail);
}

export interface OrderLookup {
  orderNumber: string;
  customerEmail: string;
}

export async function getMyOrders(page = 1, limit = 10): Promise<MyOrdersResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return api.get<MyOrdersResponse>(`/api/orders/getMyOrders?${params.toString()}`);
}

export async function trackMyOrders(orders: OrderLookup[]): Promise<{ success: boolean; data: Order[] }> {
  const firstPage = await getMyOrders(1, 50);
  const pages = await Promise.all(
    Array.from(
      { length: Math.max(0, firstPage.data.pagination.totalPages - 1) },
      (_, index) => getMyOrders(index + 2, 50),
    ),
  );
  const summaries = [firstPage, ...pages].flatMap((response) => response.data.orders);
  const orderNumbers = new Set(orders.map(({ orderNumber }) => orderNumber.trim().toUpperCase()));
  const filtered = summaries.filter((order) => orderNumbers.has(order.orderNumber.trim().toUpperCase()));
  return {
    success: firstPage.success,
    data: filtered.map((order) => toOrderRecord({ ...order }, orders[0]?.customerEmail ?? '')),
  };
}

export async function updateDeliveryDetails(
  orderNumber: string,
  addressId: string,
): Promise<{ success: boolean; message: string; data: Partial<Order> }> {
  if (!addressId) {
    throw new Error('Select a saved delivery address before updating this order.');
  }

  return api.patch<{ success: boolean; message: string; data: Partial<Order> }>(
    `/api/orders/updateDeliveryDetails/${encodeURIComponent(orderNumber.trim().toUpperCase())}`,
    { addressId }
  );
}

export async function cancelOrder(
  orderNumber: string,
): Promise<{ success: boolean; message: string; data: { orderNumber: string; customerMealStatus: string } }> {
  return api.patch(`/api/orders/cancelOrder/${encodeURIComponent(orderNumber.trim().toUpperCase())}`, {});
}
