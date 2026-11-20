import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@core/api/apiClient';

export interface NewKitchenOrderEvent {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmountInr: number;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

export interface KitchenOrderStatusEvent {
  orderNumber: string;
  status: string;
  deliveryStatus: string | null;
  at: string;
}

interface KitchenServerEvents {
  'new-order': (payload: NewKitchenOrderEvent) => void;
  'order-status': (payload: KitchenOrderStatusEvent) => void;
}

type KitchenSocket = Socket<KitchenServerEvents>;

let kitchenSocket: KitchenSocket | null = null;

export function getKitchenSocket(): KitchenSocket {
  if (!kitchenSocket) {
    kitchenSocket = io(API_URL, {
      autoConnect: false,
      withCredentials: true,
    });
  }

  return kitchenSocket;
}
