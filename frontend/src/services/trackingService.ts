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

export interface TrackingKitchen {
  _id?: string;
  name: string;
  address: string;
  location?: TrackingCoordinates | null;
}

export interface TrackingRider {
  name?: string;
  vehicleType?: string;
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
  totalAmountInr: number;
  sponsoredMealsCount: number;
  placedAt: string;
  estimatedDeliveryAt: string | null;
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

export async function trackLiveOrder(orderNumber: string, customerEmail: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.post('/api/orders/trackLiveOrder', {
    orderNumber: orderNumber.trim().toUpperCase(),
    customerEmail: customerEmail.trim().toLowerCase(),
  });
}
