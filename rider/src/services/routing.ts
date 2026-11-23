// OSRM (Open Source Routing Machine) API for route calculation and ETA
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

interface RouteResponse {
  code: string;
  routes?: Array<{
    geometry: {
      coordinates: [number, number][];
    };
    duration: number; // seconds
    distance: number; // meters
  }>;
}

interface RouteResult {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
  etaMinutes: number;
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

/**
 * Get route from rider to destination using OSRM
 * @param fromLng Longitude of starting point
 * @param fromLat Latitude of starting point  
 * @param toLng Longitude of destination
 * @param toLat Latitude of destination
 * @returns Route with coordinates, duration, distance, and ETA in minutes
 */
export async function getRoute(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data: RouteResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      console.log('OSRM no route found, using fallback');
      return null;
    }

    const route = data.routes[0];
    const durationMinutes = Math.ceil(route.duration / 60);
    const distanceKm = (route.distance / 1000).toFixed(1);

    console.log('OSRM route:', { durationMinutes, distanceKm });
    return {
      coordinates: route.geometry.coordinates,
      duration: route.duration,
      distance: route.distance,
      etaMinutes: durationMinutes,
    };
  } catch (error) {
    console.error('OSRM route error:', error);
    return null;
  }
}

/**
 * Fallback ETA calculation based on straight-line distance
 * Assumes average speed of 20 km/h in city traffic
 */
export function calculateFallbackEta(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): RouteResult {
  const distanceMeters = calculateDistance(fromLat, fromLng, toLat, toLng);
  const speedKmh = 20; // Average city speed
  const speedMs = speedKmh * 1000 / 3600; // m/s
  const durationSeconds = distanceMeters / speedMs;
  const etaMinutes = Math.ceil(durationSeconds / 60);

  // Simple straight line coordinates
  const coordinates: [number, number][] = [
    [fromLng, fromLat],
    [toLng, toLat]
  ];

  return {
    coordinates,
    duration: durationSeconds,
    distance: distanceMeters,
    etaMinutes,
  };
}

/**
 * Format ETA for display
 * @param minutes ETA in minutes
 * @returns Formatted string like "5 min" or "1 hr 30 min"
 */
export function formatEta(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
