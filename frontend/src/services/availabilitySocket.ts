import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../config';

export interface MealAvailabilityEvent {
  mealId: string;
  isAvailable: boolean;
  unavailableReason: string;
  at: string;
}

interface AvailabilityServerEvents {
  'meal-availability': (payload: MealAvailabilityEvent) => void;
}

type AvailabilitySocket = Socket<AvailabilityServerEvents>;

let availabilitySocket: AvailabilitySocket | null = null;

export function getAvailabilitySocket(): AvailabilitySocket {
  if (!availabilitySocket) {
    availabilitySocket = io(API_URL, {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return availabilitySocket;
}
