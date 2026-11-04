import { api } from './apiClient';

export interface Kitchen {
  _id: string;
  name: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export async function getActiveKitchens(): Promise<Kitchen[]> {
  const response = await api.get<{ success: boolean; data: Kitchen[] }>('/api/kitchen/getActiveKitchens');
  return response.data;
}
