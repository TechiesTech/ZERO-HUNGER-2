import { api } from './apiClient';

export interface KitchenAddress {
  addressLine1?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formatted?: string;
}

export type KitchenAddressValue = string | KitchenAddress | null | undefined;

export function formatKitchenAddress(address: KitchenAddressValue): string {
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

export interface Kitchen {
  _id: string;
  name: string;
  address?: KitchenAddressValue;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export async function getActiveKitchens(): Promise<Kitchen[]> {
  const response = await api.get<{ success: boolean; data: Kitchen[] }>('/api/kitchen/getActiveKitchens');
  return response.data.map((kitchen) => ({
    ...kitchen,
    address: formatKitchenAddress(kitchen.address),
  }));
}
