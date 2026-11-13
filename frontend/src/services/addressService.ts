import { api } from './apiClient';
import type { DeliveryAddress, DeliveryPoint } from './orderService';

export interface SavedAddress extends DeliveryAddress {
  _id: string;
  label?: 'home' | 'work' | 'other';
  customerName: string;
  customerPhone: string;
  location: DeliveryPoint;
  isDefault: boolean;
}

export interface CreateAddressRequest extends DeliveryAddress {
  customerName: string;
  customerPhone: string;
  location: DeliveryPoint;
  label: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export type UpdateAddressRequest = Partial<Omit<CreateAddressRequest, 'isDefault'>>;

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

export async function updateAddress(
  addressId: string,
  changes: UpdateAddressRequest
): Promise<SavedAddress> {
  const response = await api.patch<{ success: boolean; data: SavedAddress }>(
    `/api/addresses/updateAddress/${addressId}`,
    changes
  );
  return response.data;
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete<{ success: boolean; data: { _id: string } }>(
    `/api/addresses/deleteAddress/${addressId}`
  );
}
