/**
 * frontend/src/hooks/index.ts
 * Unified hooks for frontend
 */

import { useState, useEffect } from 'react';
import { getAllMeals, toMealProduct, type Meal } from '../services/mealsService';
import { getAvailabilitySocket } from '../services/availabilitySocket';
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
        const firstPage = await getAllMeals({ kitchenId, page: 1, limit: 100 });
        const remainingPages = await Promise.all(
          Array.from(
            { length: Math.max(0, firstPage.pagination.totalPages - 1) },
            (_, index) => getAllMeals({ kitchenId, page: index + 2, limit: 100 })
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

  useEffect(() => {
    const socket = getAvailabilitySocket();
    const handleAvailability = (event: { mealId: string; isAvailable: boolean; unavailableReason: string }) => {
      setMeals((current) =>
        current.map((meal) =>
          meal.id === event.mealId
            ? { ...meal, isAvailable: event.isAvailable, unavailableReason: event.unavailableReason }
            : meal
        )
      );
    };
    const handleReconnect = () => {
      if (!kitchenId) return;
      void (async () => {
        try {
          const firstPage = await getAllMeals({ kitchenId, page: 1, limit: 100 });
          const remainingPages = await Promise.all(
            Array.from(
              { length: Math.max(0, firstPage.pagination.totalPages - 1) },
              (_, index) => getAllMeals({ kitchenId, page: index + 2, limit: 100 })
            )
          );
          setMeals([firstPage, ...remainingPages].flatMap((response) => response.data).map(toMealProduct));
        } catch {
          // Keep the last known menu state until the next successful reconnect refresh.
        }
      })();
    };

    socket.on('meal-availability', handleAvailability);
    socket.io.on('reconnect', handleReconnect);
    socket.connect();

    return () => {
      socket.off('meal-availability', handleAvailability);
      socket.io.off('reconnect', handleReconnect);
    };
  }, [kitchenId]);

  return { meals, loading, error };
}
