const OSRM_BASE_URL = (process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/+$/, '');
const OSRM_URL = `${OSRM_BASE_URL}/route/v1/driving`;
const CACHE_TTL_MS = 15 * 1000;
const CACHE_MAX = 500;

const cache = new Map(); // key -> { route, expiresAt }

const isPoint = (p) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude);

// Road route between two points, or null if OSRM fails (tracking must still work without it)
const getRoadRoute = async (from, to) => {
    if (!isPoint(from) || !isPoint(to)) return null;

    const url = `${OSRM_URL}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return null;
        return {
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration),
            path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // Leaflet order
        };
    } catch {
        return null;
    }
};

// Cached per order, leg and destination, so a changed address gets a new route
// and rider-to-kitchen and rider-to-customer routes never mix.
const getCachedRoute = async (orderNumber, leg, from, to) => {
    if (!isPoint(from) || !isPoint(to)) return null;

    const key = `${orderNumber}:${leg}:${to.latitude},${to.longitude}`;
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.route;

    const route = await getRoadRoute(from, to);
    if (route) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(key, { route, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return route;
};

export { getRoadRoute, getCachedRoute };