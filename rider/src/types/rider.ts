export type RiderStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type VehicleType = 'bike' | 'scooty';
export type UserRole = 'customer' | 'kitchen' | 'rider' | 'admin';

export interface RiderUser {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  roles: UserRole[];
  status: RiderStatus;
  rejectionReason?: string;
  isAvailable?: boolean;
}

export const hasRole = (user: RiderUser | null | undefined, role: UserRole) =>
  Boolean(user?.roles?.includes(role));

export interface Coordinates {
  latitude: number;
  longitude: number;
  heading?: number | null;
  updatedAt?: string;
}

export interface AvailableOrder {
  orderNumber: string;
  totalAmountInr: number;
  sponsoredMealsCount: number;
  itemsCount?: number;
  customerMealStatus: 'readyforpickup' | 'confirmed' | 'preparing';
  kitchen: {
    name: string;
    address: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryAddress: {
    addressLine1: string;
    area: string;
    city: string;
    pincode: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: string;
}

export interface ActiveDelivery {
  orderNumber: string;
  customerMealStatus: 'readyforpickup' | 'outfordelivery' | 'delivered';
  customerName: string;
  customerPhone?: string;
  totalAmountInr: number;
  sponsoredMealsCount: number;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  kitchen: {
    name: string;
    phone?: string;
    address: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryAddress: {
    addressLine1: string;
    area: string;
    city: string;
    pincode: string;
    landmark?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface PastDelivery {
  _id: string;
  orderNumber: string;
  deliveredAt: string;
  amount: number;
  customerMealStatus: string;
}

