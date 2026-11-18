import { ApiError, apiClient } from './apiClient';
import type { AvailableOrder, ActiveDelivery, PastDelivery, RiderUser, VehicleType } from '../types/rider';

export const riderService = {
  // Auth
  login: async (identifier: string, password: string): Promise<{ user: RiderUser }> => {
    return apiClient.post('/auth/login', { identifier, password });
  },

  registerRider: async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
  }) => {
    return apiClient.post('/riders/registerRider', payload);
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<{ user: RiderUser }> => {
    return apiClient.get('/auth/me');
  },

  // Availability & GPS
  setAvailability: async (isAvailable: boolean): Promise<{ isAvailable: boolean }> => {
    return apiClient.patch('/riders/setAvailability', { isAvailable });
  },

  updateLocation: async (coords: { latitude: number; longitude: number; heading?: number | null }) => {
    return apiClient.patch('/riders/updateLocation', coords);
  },

  // Order Operations
  getAvailableOrders: async (): Promise<AvailableOrder[]> => {
    const res = await apiClient.get<any>('/riders/getAvailableOrders');
    return Array.isArray(res) ? res : res?.orders || [];
  },

  acceptOrder: async (orderNumber: string) => {
    return apiClient.post(`/riders/acceptOrder/${orderNumber}`);
  },

  markPickedUp: async (orderNumber: string) => {
    const formData = new FormData();
    formData.append('status', 'pickedup');
    return apiClient.postMultipart(`/riders/updateStatus/${orderNumber}`, formData);
  },

  markDelivered: async (orderNumber: string, photo: File) => {
    const formData = new FormData();
    formData.append('status', 'delivered');
    formData.append('photo', photo);
    return apiClient.postMultipart(`/riders/updateStatus/${orderNumber}`, formData);
  },

  // The API answers 404 when the rider has no open delivery. That is a normal
  // "nothing to show" response, so it must not surface as a failure.
  currentDelivery: async (): Promise<ActiveDelivery | null> => {
    try {
      const res = await apiClient.get<any>('/riders/currentDelivery');
      return res?.order || res || null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  getMyDeliveries: async (month?: string, page = 1, limit = 10): Promise<{ deliveries: PastDelivery[]; total: number }> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (month) query.set('month', month);
    return apiClient.get(`/riders/getMyDeliveries?${query.toString()}`);
  },
};

