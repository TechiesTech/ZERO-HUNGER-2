import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/adminApi';
import type { Meal, MealsResponse, SingleMealResponse, MealFormData, ImageUploadResponse } from '@/types';

/* ─────────────────── useMeals ─────────────────── */
export function useMeals() {
  const [meals, setMeals]       = useState<Meal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<MealsResponse>('/api/meals/getAllMeals');
      setMeals(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const createMeal = async (data: MealFormData) => {
    const res = await adminApi.post<SingleMealResponse>('/api/meals/createMeal', data);
    await fetchMeals();
    return res;
  };

  const updateMeal = async (id: string, data: Partial<MealFormData>) => {
    const res = await adminApi.patch<SingleMealResponse>(`/api/meals/updateMealById/${id}`, data);
    await fetchMeals();
    return res;
  };

  const deleteMeal = async (id: string) => {
    await adminApi.delete(`/api/meals/deleteMeal/${id}`);
    await fetchMeals();
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return adminApi.upload<ImageUploadResponse>('/api/meals/upload-image', fd);
  };

  return { meals, loading, error, fetchMeals, createMeal, updateMeal, deleteMeal, uploadImage };
}
