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
