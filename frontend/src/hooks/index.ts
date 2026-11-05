/**
 * frontend/src/hooks/index.ts
 * Unified hooks for frontend
 */

import { useState, useEffect } from 'react';
import { getAllMeals, toMealProduct, type Meal } from '../services/mealsService';
import type { MealProduct } from '../data/mealProgram';

export function useMeals(kitchenId?: string | null) {
  const [meals, setMeals] = useState<MealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchMeals() {
      if (!kitchenId) {
        setMeals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const firstPage = await getAllMeals({ kitchenId, isAvailable: true, page: 1, limit: 100 });
        const remainingPages = await Promise.all(
          Array.from(
            { length: Math.max(0, firstPage.pagination.totalPages - 1) },
            (_, index) => getAllMeals({ kitchenId, isAvailable: true, page: index + 2, limit: 100 })
          )
        );
        if (active) {
          setMeals([firstPage, ...remainingPages].flatMap((response) => response.data).map(toMealProduct));
        }
      } catch (err: any) {
        if (active) {
          setMeals([]);
          setError(err instanceof Error ? err.message : 'Failed to load meals');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMeals();
    return () => {
      active = false;
    };
  }, [kitchenId]);

  return { meals, loading, error };
}
