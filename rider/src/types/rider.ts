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
  vehicleType?: VehicleType;
  vehicleNumber?: string;
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
    phone?: string;
    address: string | {
      addressLine1?: string;
      area?: string;
      city?: string;
      state?: string;
    };
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
  deliveryArea?: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

export interface ActiveDelivery {
  orderNumber: string;
  status?: string;
  customerMealStatus: 'readyforpickup' | 'outfordelivery' | 'delivered';
  customerName: string;
  customerPhone?: string;
  totalAmountInr: number;
  sponsoredMealsCount: number;
  acceptedAt?: string;
  pickedUpAt?: string;
  items?: Array<{
    productName: string;
    quantity: number;
  }>;
  kitchen: {
    name: string;
    phone?: string;
    address: string | {
      addressLine1?: string;
      area?: string;
      city?: string;
      state?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    area: string;
    landmark?: string;
    city: string;
    state?: string;
    pincode: string;
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

