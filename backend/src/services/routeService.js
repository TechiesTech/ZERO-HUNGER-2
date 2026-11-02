const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const TTL_MS = 45 * 1000;
const MAX_CACHE = 500;
const cache = new Map(); // key -> { route, expiresAt }

const getRoadRoute = async (from, to) => {
    const url = `${OSRM_URL}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(url, { signal: controller.signal });
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
        return null; // tracking must still work if OSRM is down
    } finally {
        clearTimeout(timer);
    }
};

// Cached per order and destination, so a changed address gets a new route
const getCachedRoute = async (orderNumber, from, to) => {
    const key = `${orderNumber}:${to.latitude},${to.longitude}`;
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.route;

    const route = await getRoadRoute(from, to);
    if (route) {
        if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
        cache.set(key, { route, expiresAt: Date.now() + TTL_MS });
    }
    return route;
};

export { getRoadRoute, getCachedRoute };