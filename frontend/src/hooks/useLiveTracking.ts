/**
 * frontend/src/hooks/useLiveTracking.ts
 * Custom hook for live order tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { trackLiveOrder, type TrackingData } from '../services/trackingService';

export function useLiveTracking(orderNumber: string, customerEmail: string) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    try {
      const response = await trackLiveOrder(orderNumber, customerEmail);
      setTracking(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderNumber, customerEmail]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  return { tracking, loading, error, refetch: fetchTracking };
}
