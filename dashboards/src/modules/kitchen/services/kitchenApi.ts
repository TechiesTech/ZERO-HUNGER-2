import { api } from '@core/api/apiClient';
import type { KitchenOrder, KitchenProfile, Meal, MealFormData } from '../types';

export const kitchenApi = {
  updateProfile: (payload: { address: string; location: { latitude: number; longitude: number } }) =>
    api.put<{ success: boolean; data: KitchenProfile }>('/api/kitchen/me', payload),

  getProfile: () =>
    api.get<{ success: boolean; data: KitchenProfile }>('/api/kitchen/me'),

  createMeal: (payload: MealFormData) =>
    api.post<{ success: boolean; data: Meal }>('/api/meals/createMeal', payload),

  updateMeal: (mealId: string, payload: Partial<MealFormData>) =>
    api.patch<{ success: boolean; data: Meal }>(`/api/meals/updateMealById/${mealId}`, payload),

  getMeals: (kitchenId?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (kitchenId) params.set('kitchenId', kitchenId);
    return api.get<{
      success: boolean;
      count: number;
      pagination: { page: number; limit: number; totalMeals: number; totalPages: number };
      data: Meal[];
    }>(
      `/api/meals/getAllMeals?${params.toString()}`
    );
  },

  deleteMeal: (mealId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/meals/deleteMeal/${mealId}`),

  getPaidOrders: () =>
    api.get<{ success: boolean; data: KitchenOrder[] }>('/api/kitchen/getPaidOrders'),

  startPreparing: (orderId: string) =>
    api.patch<{ success: boolean; message: string; data?: unknown }>(
      `/api/kitchen/startPreparing/${orderId}`
    ),

  markReady: (orderId: string) =>
    api.patch<{ success: boolean; message: string; data?: unknown }>(
      `/api/kitchen/markReady/${orderId}`
    ),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ success: boolean; data: { imageUrl: string; imagePublicId: string } }>(
      '/api/meals/upload-image',
      formData
    );
  },
};
