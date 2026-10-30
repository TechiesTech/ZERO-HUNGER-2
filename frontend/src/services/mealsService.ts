/**
 * frontend/src/services/mealsService.ts
 * Service for fetching meals from the backend API.
 */

import { apiClient } from './apiClient';

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
  createdAt: string;
  updatedAt: string;
}

export interface MealsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    totalMeals: number;
    totalPages: number;
  };
  data: Meal[];
}

/**
 * Convert backend Meal to frontend MealProduct format
 */
export function toMealProduct(meal: Meal) {
  return {
    id: meal._id,
    slug: meal.mealSlug,
    name: meal.mealName,
    priceInr: meal.priceInRupees,
    categories: meal.mealCategories as any[],
    ingredients: meal.ingredientsList,
    shortDescription: meal.description,
    proteinGrams: meal.proteinInGrams,
    calories: meal.caloriesKcal,
    image: meal.imageUrl,
    isEligibleBuyOneGiveOne: true,
  };
}

/**
 * Fetch all meals from the backend.
 * @param query - Optional query parameters (page, limit, category, isAvailable)
 */
export async function getAllMeals(query?: {
  page?: number;
  limit?: number;
  category?: string;
  isAvailable?: boolean;
}): Promise<MealsResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.category) params.append('category', query.category);
  if (query?.isAvailable !== undefined) params.append('isAvailable', query.isAvailable.toString());

  const queryString = params.toString();
  const path = queryString ? `/api/meals/getAllMeals?${queryString}` : '/api/meals/getAllMeals';

  return apiClient.get<MealsResponse>(path);
}

/**
 * Fetch a single meal by slug.
 * @param slug - The meal slug
 */
export async function getMealBySlug(slug: string): Promise<Meal> {
  const response = await getAllMeals();
  const meal = response.data.find((m) => m.mealSlug === slug);
  if (!meal) {
    throw new Error(`Meal with slug "${slug}" not found`);
  }
  return meal;
}

