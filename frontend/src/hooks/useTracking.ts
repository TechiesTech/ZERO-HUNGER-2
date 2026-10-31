/**
 * frontend/src/hooks/useTracking.ts
 * Custom hook for live delivery tracking with Socket.IO
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getTrackingData, type TrackingData, type LocationUpdate } from '../services/trackingService';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useTracking(orderId: string) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await getTrackingData(orderId);
      setTracking(response.data);
      setCurrentLocation(response.data.currentLocation);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('client:join', { orderId });

    socket.on('delivery:location', (data: LocationUpdate) => {
      setCurrentLocation(data);
      setTracking((prev) => prev ? { ...prev, currentLocation: data } : null);
    });

    socket.on('delivery:update', (data: { status: string; timestamp: string }) => {
      setTracking((prev) => prev ? { ...prev, status: data.status } : null);
    });

    socket.on('error', (error: { message: string }) => {
      setError(error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData: LocationUpdate = {
          orderId,
          deliveryPartnerId: 'DP-001',
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        };

        try {
          const socket = socketRef.current;
          if (socket) {
            socket.emit('rider:location', locationData);
          }
        } catch (err: any) {
          console.error('Error sending location:', err);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [orderId]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  return {
    tracking,
    currentLocation,
    loading,
    error,
    startLocationTracking,
    stopLocationTracking,
    refetch: fetchTrackingData,
  };
}
