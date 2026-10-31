/**
 * frontend/src/hooks/index.ts
 * Unified hooks for frontend
 */

import { useState, useEffect } from 'react';
import { getAllMeals, toMealProduct, type Meal } from '../services/mealsService';
import { MEAL_PRODUCTS as MOCK_MEAL_PRODUCTS, type MealProduct } from '../data/mealProgram';

export function useMeals() {
  const [meals, setMeals] = useState<MealProduct[]>(MOCK_MEAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeals() {
      try {
        const response = await getAllMeals({ isAvailable: true });
        const products = response.data.map(toMealProduct);
        setMeals(products);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch meals from backend, using mock data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, []);

  return { meals, loading, error };
}
