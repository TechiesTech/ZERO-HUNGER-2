import { useEffect, useRef, useState, useCallback } from 'react';
import { riderService } from '../services/riderService';

interface UseRiderLocationOptions {
  isOnline: boolean;
  hasActiveDelivery: boolean;
  onError?: (msg: string) => void;
}

export function useRiderLocation({ isOnline, hasActiveDelivery, onError }: UseRiderLocationOptions) {
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number; heading?: number | null } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  // Interval: 5s when active delivery, 20s when idle online
  const minIntervalMs = hasActiveDelivery ? 5000 : 20000;

  const sendLocation = useCallback(
    async (coords: { latitude: number; longitude: number; heading?: number | null }) => {
      const now = Date.now();
      // Rate limiter protection: never send faster than 3.5s (max ~17/min, safely under 20 limit)
      if (now - lastSentRef.current < 3500) return;

      lastSentRef.current = now;
      try {
        await riderService.updateLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading ?? undefined,
        });
        setGpsError(null);
      } catch (err: any) {
        console.warn('[GPS] Failed to send location ping:', err.message);
      }
    },
    []
  );

  // Send immediate GPS position when going online
  const sendImmediateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
        };
        setLastCoords(coords);
        sendLocation(coords);
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
        onError?.(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [sendLocation, onError]);

  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Trigger immediate ping on go-online
    sendImmediateLocation();

    if (!navigator.geolocation) {
      setGpsError('GPS not available');
      return;
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
        };
        setLastCoords(coords);

        const elapsed = Date.now() - lastSentRef.current;
        if (elapsed >= minIntervalMs) {
          sendLocation(coords);
        }
      },
      (err) => {
        const message = err.code === 1 ? 'Location permission denied' : 'Unable to acquire GPS fix';
        setGpsError(message);
        onError?.(message);
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline, minIntervalMs, sendImmediateLocation, sendLocation, onError]);

  return { lastCoords, gpsError, sendImmediateLocation };
}

