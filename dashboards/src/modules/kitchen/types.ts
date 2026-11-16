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
  mealName?: string;
  productName?: string;
  quantity: number;
  priceAtOrder?: number;
  price?: number;
}

export interface KitchenOrder {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerMealStatus: 'confirmed' | 'preparing' | 'readyforpickup' | string;
  status?: 'confirmed' | 'preparing' | 'readyforpickup' | string;
  totalAmountInr?: number;
  totalAmount?: number;
  items: KitchenOrderItem[];
  createdAt?: string;
  deliveryAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | string;
  user?: {
    name?: string;
    email?: string;
  };
}

/* ── Kitchen Profile Types (Step 5, 6) ── */
export interface KitchenProfile {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


