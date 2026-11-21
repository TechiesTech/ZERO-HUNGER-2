import type { KitchenDeliveryAddress } from '../types';

export function formatDeliveryAddress(address?: string | KitchenDeliveryAddress): string {
  if (!address) return '';
  if (typeof address === 'string') return address;

  return [
    [address.addressLine1, address.addressLine2].filter(Boolean).join(', '),
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(', ');
}
