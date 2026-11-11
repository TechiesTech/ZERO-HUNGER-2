import { api } from './apiClient';
import type { DeliveryAddress, DeliveryPoint } from './orderService';

export interface SavedAddress extends DeliveryAddress {
  _id: string;
  customerName: string;
  customerPhone: string;
  location: DeliveryPoint;
  isDefault: boolean;
}

export interface CreateAddressRequest extends DeliveryAddress {
  customerName: string;
  customerPhone: string;
  location: DeliveryPoint;
  label: 'home';
  isDefault: boolean;
}

export async function getMyAddresses(): Promise<SavedAddress[]> {
  const response = await api.get<{ success: boolean; data: SavedAddress[] }>(
    '/api/addresses/getMyAddresses'
  );
  return response.data;
}

export async function createAddress(address: CreateAddressRequest): Promise<SavedAddress> {
  const response = await api.post<{ success: boolean; data: SavedAddress }>(
    '/api/addresses/createAddress',
    address
  );
  return response.data;
}
