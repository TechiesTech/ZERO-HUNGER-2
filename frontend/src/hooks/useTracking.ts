/**
 * frontend/src/hooks/useTracking.ts
 * Custom hook for live delivery tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { trackLiveOrder, type TrackingData } from '../services/trackingService';

export function useTracking(orderNumber: string) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = useCallback(async () => {
    if (!orderNumber) return;
    try {
      const response = await trackLiveOrder(orderNumber);
      setTracking(response.data);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Tracking failed');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  return { tracking, loading, error, refresh: fetchTrackingData };
}
