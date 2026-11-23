/**
 * frontend/src/services/trackingService.ts
 * Live order tracking API service
 */

import { api } from './apiClient';

export interface TimelineStep {
  status: string;
  at: string | null;
}

export interface TrackingCoordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface TrackingAddress {
  addressLine1?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formatted?: string;
}

export function formatAddressText(address: string | TrackingAddress | null | undefined): string {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const formatted = address.formatted?.trim();
  if (formatted) return formatted;

  return [
    address.addressLine1,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(', ');
}

export interface TrackingKitchen {
  _id?: string;
  name: string;
  address: string | TrackingAddress | null;
  location?: TrackingCoordinates | null;
}

export interface TrackingRider {
  name?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  currentLocation?: TrackingCoordinates & {
    heading?: number | null;
    updatedAt?: string | null;
  };
  isLocationStale?: boolean;
}

export interface TrackingRoute {
  path?: Array<[number, number]>;
  distanceMeters?: number;
  durationSeconds?: number;
}

export interface LocationUpdate {
  orderId?: string;
  deliveryPartnerId?: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string;
  heading?: number | null;
}

export interface TrackingItem {
  productName: string;
  quantity: number;
  unitPriceInr: number;
  totalPriceInr: number;
  sponsoredChildMeals: number;
}

export interface TrackingData {
  orderNumber: string;
  customerName: string;
  customerMealStatus: string;
  paymentStatus: string;
  deliveryOtp?: string | null;
  totalAmountInr: number;
  sponsoredMealsCount: number;
  placedAt: string;
  estimatedDeliveryAt: string | null;
  deliveryPhotoUrl?: string | null;
  timeline: TimelineStep[];
  destination: TrackingCoordinates | null;
  kitchen?: TrackingKitchen | null;
  rider: TrackingRider | null;
  route?: TrackingRoute | null;
  routes?: {
    toKitchen?: TrackingRoute | null;
    toCustomer?: TrackingRoute | null;
  } | null;
  items: TrackingItem[];
  canEditDetails: boolean;
  canCancel: boolean;
}

export async function getTrackingData(orderNumber: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.get(`/api/orders/trackLiveOrder/${encodeURIComponent(orderNumber.trim().toUpperCase())}`);
}

export async function trackLiveOrder(orderNumber: string): Promise<{ success: boolean; data: TrackingData }> {
  return getTrackingData(orderNumber);
}
