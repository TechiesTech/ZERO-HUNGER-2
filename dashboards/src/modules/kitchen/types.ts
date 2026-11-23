/* ── Meal & Menu Types ── */
export interface Meal {
  _id: string;
  kitchenId?: string;
  mealName: string;
  mealSlug: string;
  description: string;
  ingredientsList: string[];
  mealCategories: string[];
  priceInRupees: number;
  caloriesKcal: number;
  proteinInGrams: number;
  imageUrl: string;
  imagePublicId?: string;
  isAvailable: boolean;
  unavailableReason?: string;
  displayOrder: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type MealFormData = Omit<Meal, '_id' | 'isDeleted' | 'deletedAt' | 'createdAt' | 'updatedAt'>;

export const MEAL_CATEGORIES = [
  'VEG',
  'NON-VEG',
  'PROTEIN',
  'KIDS MEALS',
  'FAMILY MEALS',
] as const;

/* ── Order Types (Step 11, 12, 13) ── */
export interface KitchenOrderItem {
  productName: string;
  quantity: number;
  unitPriceInr: number;
  totalPriceInr: number;
}

export interface KitchenDeliveryAddress {
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface KitchenOrder {
  _id: string;
  orderNumber: string;
  customerId: string;
  addressId: string;
  kitchenId: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  totalAmountInr: number;
  sponsoredMealsCount: number;
  customerMealStatus: 'confirmed' | 'preparing' | 'readyforpickup' | 'outfordelivery' | 'delivered' | 'cancelled';
  items: KitchenOrderItem[];
  deliveryAddress?: string | KitchenDeliveryAddress;
  createdAt: string;
  updatedAt: string;
}

export function isKitchenOrderStatus(status: string): status is KitchenOrder['customerMealStatus'] {
  switch (status) {
    case 'confirmed':
    case 'preparing':
    case 'readyforpickup':
    case 'outfordelivery':
    case 'delivered':
    case 'cancelled':
      return true;
    default:
      return false;
  }
}

export function isActiveKitchenOrderStatus(
  status: KitchenOrder['customerMealStatus']
): status is 'confirmed' | 'preparing' | 'readyforpickup' {
  return status === 'confirmed' || status === 'preparing' || status === 'readyforpickup';
}

/* ── Kitchen Profile Types (Step 5, 6) ── */
export interface KitchenProfile {
  _id?: string;
  user?: string;
  address?: string | KitchenDeliveryAddress;
  location?: {
    latitude: number;
    longitude: number;
  };
  detailsComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


