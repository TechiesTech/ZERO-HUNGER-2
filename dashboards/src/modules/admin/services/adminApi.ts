import { api } from '@core/api/apiClient';

export { api };

export interface KitchenSummary {
  _id: string;
  name: string;
}

export interface KitchenListItem extends KitchenSummary {
  email: string;
  phone: string;
  address?: string | {
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  location?: { latitude: number; longitude: number };
  status?: KitchenUserStatus;
  isActive: boolean;
  createdAt: string;
}

export type KitchenUserStatus = 'pending' | 'active' | 'rejected' | 'disabled';

export interface KitchenUserDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  status: KitchenUserStatus;
  rejectionReason?: string;
  mustChangePassword: boolean;
}

export interface KitchenListResponse {
  success: boolean;
  data: {
    kitchens: KitchenListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export interface CreateKitchenPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RiderStats {
  totalRiders: number;
  pending: number;
  active: number;
  live: number;
  busy: number;
  free: number;
}

export type RiderStatus = 'pending' | 'active' | 'rejected';
export type RiderListFilter = 'pending' | 'active' | 'live' | 'busy' | 'free';

export interface RiderListItem {
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: RiderStatus;
  vehicleType: 'bike' | 'scooty';
  vehicleNumber: string;
  totalDeliveries: number;
  lastLocationAt?: string | null;
  isLive: boolean;
  isBusy: boolean;
  currentOrderNumber?: string;
}

export interface RiderListResponse {
  success: boolean;
  data: {
    riders: RiderListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export function getActiveKitchens() {
  return api.get<{ success: boolean; data: KitchenSummary[] }>('/api/kitchen/getActiveKitchens');
}

export function getKitchens(query: URLSearchParams) {
  return api.get<KitchenListResponse>(`/api/kitchen/getAllKitchens?${query}`);
}

export function createKitchen(payload: CreateKitchenPayload) {
  return api.post('/api/users/createUser', { ...payload, roles: ['kitchen'] });
}

export function getKitchenUser(id: string) {
  return api.get<{ success: boolean; data: { user: KitchenUserDetails } }>(
    `/api/users/getUserById/${id}`
  );
}

export function updateKitchenUserStatus(
  id: string,
  payload: { status: KitchenUserStatus; rejectionReason?: string }
) {
  return api.patch<{ success: boolean; data: { user: KitchenUserDetails } }>(
    `/api/users/status/${id}`,
    payload
  );
}

export function deleteKitchenUser(id: string) {
  return api.delete<{ success: boolean; message: string }>(`/api/users/deleteUserById/${id}`);
}

export function getRiderStats() {
  return api.get<{ success: boolean; data: RiderStats }>('/api/riders/getRiderStats');
}

export function getRiders(query: URLSearchParams) {
  return api.get<RiderListResponse>(`/api/riders/getAllRiders?${query}`);
}

export function reviewRider(userId: string, payload: { status: 'active' | 'rejected'; reason?: string }) {
  return api.patch<{ success: boolean; data: { _id: string; name: string; email: string; status: RiderStatus } }>(
    `/api/riders/reviewRider/${userId}`,
    payload
  );
}
