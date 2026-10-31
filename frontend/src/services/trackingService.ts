/**
 * frontend/src/services/trackingService.ts
 * Live order tracking API service
 */

import { api } from './apiClient';

export interface TimelineStep {
  status: string;
  at: string | null;
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
  rider: null;
  items: any[];
  canEditDetails: boolean;
  canCancel: boolean;
}

export async function trackLiveOrder(orderNumber: string, customerEmail: string): Promise<{ success: boolean; data: TrackingData }> {
  return api.post('/api/orders/trackLiveOrder', { orderNumber, customerEmail });
}
