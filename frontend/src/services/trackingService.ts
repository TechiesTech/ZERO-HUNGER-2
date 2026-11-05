/**
 * frontend/src/services/trackingService.ts
 * Live order tracking API service
 */

import { api } from './apiClient';

export interface TimelineStep {
  status: string;
  at: string | null;
}

export interface RouteData {
  distanceMeters: number;
  durationSeconds: number;
  path: [number, number][];
}

export interface RiderTrackingData {
  name: string;
  vehicleType: string;
  status: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  currentLocation: {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    updatedAt: string | null;
  };
  isLocationStale: boolean;
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
  destination: { latitude: number; longitude: number } | null;
  kitchen: {
    name: string;
    address?: string;
    location: { latitude: number; longitude: number } | null;
  } | null;
  rider: RiderTrackingData | null;
  routes: {
    toKitchen: RouteData | null;
    toCustomer: RouteData | null;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceInr: number;
    totalPriceInr: number;
    sponsoredChildMeals: number;
  }>;
  canEditDetails: boolean;
  canCancel: boolean;
}

export async function trackLiveOrder(orderNumber: string, customerEmail: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.post('/api/orders/trackLiveOrder', { orderNumber, customerEmail });
}
