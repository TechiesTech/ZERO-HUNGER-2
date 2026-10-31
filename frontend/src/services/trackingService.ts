/**
 * frontend/src/services/trackingService.ts
 * Live delivery tracking API service
 */

import { api } from './apiClient';

export interface LocationUpdate {
  orderId: string;
  deliveryPartnerId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface TrackingData {
  orderId: string;
  deliveryPartnerId: string;
  currentLocation: LocationUpdate | null;
  locationHistory: LocationUpdate[];
  status: string;
  lastLocationUpdate: string;
  deliveredAt?: string;
}

export async function getTrackingData(orderId: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.get(`/api/tracking/${orderId}`);
}

export async function updateLocation(data: LocationUpdate): Promise<{ success: boolean; data: TrackingData }> {
  return api.post(`/api/tracking/${data.orderId}/location`, data);
}

export async function updateDeliveryStatus(orderId: string, status: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.patch(`/api/tracking/${orderId}/status`, { status });
}

export async function assignDeliveryPartner(orderId: string, deliveryPartnerId: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.post(`/api/tracking/${orderId}/assign`, { deliveryPartnerId });
}
