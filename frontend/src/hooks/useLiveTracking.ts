import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../services/apiClient';
import { trackLiveOrder, type TrackingData } from '../services/trackingService';

const POLL_INTERVAL_MS = 5000;
const RATE_LIMIT_INTERVAL_MS = 30000;
const MAX_RETRY_INTERVAL_MS = 30000;

export function useLiveTracking(orderNumber: string) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const retryDelayRef = useRef(POLL_INTERVAL_MS);
  const latestStatusRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const stopPollingRef = useRef(false);

  const fetchTracking = useCallback(async () => {
    try {
      const response = await trackLiveOrder(orderNumber);
      setTracking(response.data);
      latestStatusRef.current = response.data.customerMealStatus;
      hasLoadedRef.current = true;
      stopPollingRef.current = false;
      retryDelayRef.current = POLL_INTERVAL_MS;
      setError(null);
      setRefreshWarning(null);
      return true;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not refresh tracking information.';
      const status = requestError instanceof ApiError ? requestError.status : null;
      if (status === 429) {
        retryDelayRef.current = RATE_LIMIT_INTERVAL_MS;
        setRefreshWarning('Tracking is being rate-limited. Updates will resume shortly.');
      } else if (status === 401 || status === 403) {
        retryDelayRef.current = RATE_LIMIT_INTERVAL_MS;
        if (hasLoadedRef.current) {
          setError(null);
          setRefreshWarning(message);
        } else {
          setError(message);
        }
      } else if (status === 404) {
        stopPollingRef.current = true;
        if (hasLoadedRef.current) {
          setError(null);
          setRefreshWarning(message);
        } else {
          setError(message);
        }
      } else {
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_INTERVAL_MS);
        setRefreshWarning('The tracking service is taking longer than usual. Retrying automatically.');
      }
      if (hasLoadedRef.current && status !== 401 && status !== 403 && status !== 404) setError(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    retryDelayRef.current = POLL_INTERVAL_MS;
    latestStatusRef.current = null;
    hasLoadedRef.current = false;
    stopPollingRef.current = false;
    setTracking(null);
    setLoading(true);
    setError(null);
    setRefreshWarning(null);

    const poll = async () => {
      await fetchTracking();
      if (
        disposed ||
        stopPollingRef.current ||
        latestStatusRef.current === 'delivered' ||
        latestStatusRef.current === 'cancelled'
      ) return;
      timer = setTimeout(poll, retryDelayRef.current);
    };

    void poll();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchTracking]);

  return { tracking, loading, error, refreshWarning, refetch: fetchTracking };
}
