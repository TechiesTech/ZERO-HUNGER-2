import { api } from './apiClient';
import type { DeliveryPoint } from './orderService';
import type { TrackingAddress } from './trackingService';

export interface RiderProfile {
  isAvailable: boolean;
  vehicleType: 'bike' | 'scooty';
  vehicleNumber: string;
  currentLocation: (DeliveryPoint & { heading: number | null; updatedAt: string | null }) | null;
}

export interface RiderKitchen {
  name: string;
  phone?: string;
  address: string | TrackingAddress | null;
  location: DeliveryPoint | null;
}

export interface RiderOrder {
  orderNumber: string;
  totalAmountInr: number;
  createdAt: string;
  deliveryArea: string;
  deliveryLocation: DeliveryPoint | null;
  kitchen: RiderKitchen | null;
}

export interface CurrentRiderDelivery {
  orderNumber: string;
  status: string;
  customerMealStatus: string;
  totalAmountInr: number;
  acceptedAt: string;
  pickedUpAt: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: TrackingAddress & { location: DeliveryPoint | null };
  kitchen: RiderKitchen | null;
}

export interface RiderHistory {
  month: string;
  totalDeliveries: number;
  deliveries: Array<{
    orderNumber: string;
    deliveredAt: string;
    area: string;
    photoUrl: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getRiderProfile(): Promise<RiderProfile> {
  const response = await api.get<{ success: boolean; data: RiderProfile }>('/api/riders/me');
  return response.data;
}

export async function setRiderAvailability(isAvailable: boolean): Promise<void> {
  await api.patch('/api/riders/setAvailability', { isAvailable });
}

export async function updateRiderLocation(point: DeliveryPoint, heading?: number | null): Promise<void> {
  await api.patch('/api/riders/updateLocation', {
    ...point,
    ...(heading != null ? { heading } : {}),
  });
}

export async function getAvailableOrders(): Promise<RiderOrder[]> {
  const response = await api.get<{ success: boolean; data: { orders: RiderOrder[] } }>(
    '/api/riders/getAvailableOrders',
  );
  return response.data.orders;
}

export async function acceptRiderOrder(orderNumber: string): Promise<void> {
  await api.post(`/api/riders/acceptOrder/${encodeURIComponent(orderNumber)}`, {});
}

export async function getCurrentDelivery(): Promise<CurrentRiderDelivery> {
  const response = await api.get<{ success: boolean; data: CurrentRiderDelivery }>(
    '/api/riders/currentDelivery',
  );
  return response.data;
}

export async function updateRiderDeliveryStatus(
  orderNumber: string,
  status: 'pickedup' | 'delivered',
  photo?: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('status', status);
  if (photo) formData.append('file', photo);
  await api.form('PATCH', `/api/riders/updateStatus/${encodeURIComponent(orderNumber)}`, formData);
}

export async function getRiderHistory(page = 1, limit = 10): Promise<RiderHistory> {
  const response = await api.get<{ success: boolean; data: RiderHistory }>(
    `/api/riders/getMyDeliveries?page=${page}&limit=${limit}`,
  );
  return response.data;
}
