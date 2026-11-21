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

  getRiderProfile: async (): Promise<{ rider: RiderUser }> => {
    return apiClient.get('/riders/me');
  },

  // Auth - Email & Password
  verifyEmail: async (email: string, code: string) => {
    return apiClient.post('/auth/verifyEmail', { email, code });
  },

  resendCode: async (email: string) => {
    return apiClient.post('/auth/resendCode', { email });
  },

  forgotPassword: async (email: string) => {
    return apiClient.post('/auth/forgotPassword', { email });
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    return apiClient.post('/auth/resetPassword', { email, code, newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.post('/auth/changePassword', { currentPassword, newPassword });
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

  releaseOrder: async (orderNumber: string) => {
    return apiClient.patch(`/riders/releaseOrder/${orderNumber}`);
  },

  markPickedUp: async (orderNumber: string) => {
    const formData = new FormData();
    formData.append('status', 'pickedup');
    return apiClient.patchMultipart(`/riders/updateStatus/${orderNumber}`, formData);
  },

  markDelivered: async (orderNumber: string, photo: File, otp: string) => {
    const formData = new FormData();
    formData.append('status', 'delivered');
    formData.append('file', photo); // Backend expects 'file' field, not 'photo'
    formData.append('otp', otp); // 4-digit delivery OTP
    return apiClient.patchMultipart(`/riders/updateStatus/${orderNumber}`, formData);
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

  getMySummary: async (month?: string): Promise<{
    today: { date: string; deliveries: number };
    month: {
      month: string;
      totalDeliveries: number;
      daysWorked: number;
      days: Array<{ date: string; deliveries: number }>;
    };
  }> => {
    const query = month ? `?month=${month}` : '';
    const res = await apiClient.get<any>(`/riders/getMySummary${query}`);
    return res?.data || res;
  },
};

