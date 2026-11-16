import { api } from '@core/api/apiClient';

export { api };

export interface KitchenSummary {
  _id: string;
  name: string;
}

export interface KitchenListItem extends KitchenSummary {
  email: string;
  phone: string;
  address?: string;
  location?: { latitude: number; longitude: number };
  isActive: boolean;
  createdAt: string;
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
  address: string;
  password: string;
  location?: { latitude: number; longitude: number };
}

export function getActiveKitchens() {
  return api.get<{ success: boolean; data: KitchenSummary[] }>('/api/kitchen/getActiveKitchens');
}

export function getKitchens(query: URLSearchParams) {
  return api.get<KitchenListResponse>(`/api/kitchen/getAllKitchens?${query}`);
}

export function createKitchen(payload: CreateKitchenPayload) {
  return api.post('/api/kitchen/createKitchen', payload);
}
