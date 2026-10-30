/* ── Admin shared types ── */

export interface Meal {
  _id: string;
  mealName: string;
  mealSlug: string;
  description: string;
  ingredientsList: string[];
  mealCategories: string[];
  priceInRupees: number;
  caloriesKcal: number;
  proteinInGrams: number;
  imageUrl: string;
  imagePublicId: string;
  isAvailable: boolean;
  unavailableReason: string;
  displayOrder: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealsResponse {
  success: boolean;
  count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  data: Meal[];
}

export interface SingleMealResponse {
  success: boolean;
  message: string;
  data: Meal;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    imageUrl: string;
    imagePublicId: string;
  };
}

export type MealFormData = Omit<Meal, '_id' | 'isDeleted' | 'deletedAt' | 'createdAt' | 'updatedAt'>;

export const MEAL_CATEGORIES = [
  'VEG',
  'NON-VEG',
  'PROTEIN',
  'KIDS MEALS',
  'FAMILY MEALS',
] as const;
