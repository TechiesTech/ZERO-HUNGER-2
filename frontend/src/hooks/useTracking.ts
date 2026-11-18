/**
 * frontend/src/hooks/useTracking.ts
 * Compatibility hook for the new backend tracking endpoint.
 */

import { useState, useEffect, useCallback } from 'react';
import { getTrackingData, type TrackingData, type LocationUpdate } from '../services/trackingService';

export function useTracking(orderId: string) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await getTrackingData(orderId);
      setTracking(response.data);
      const riderLocation = response.data.rider?.currentLocation;
      setCurrentLocation(
        riderLocation && riderLocation.latitude != null && riderLocation.longitude != null
          ? {
              orderId,
              latitude: riderLocation.latitude,
              longitude: riderLocation.longitude,
              timestamp: riderLocation.updatedAt ?? new Date().toISOString(),
              heading: riderLocation.heading ?? null,
            }
          : null,
      );
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchTrackingData();
    const interval = window.setInterval(() => {
      void fetchTrackingData();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchTrackingData]);

  return {
    tracking,
    currentLocation,
    loading,
    error,
    startLocationTracking: () => undefined,
    stopLocationTracking: () => undefined,
    refetch: fetchTrackingData,
  };
}
