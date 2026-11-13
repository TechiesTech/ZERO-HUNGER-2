const OSRM_BASE_URL = (process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/+$/, '');
const OSRM_URL = `${OSRM_BASE_URL}/route/v1/driving`;
const CACHE_TTL_MS = 10 * 60 * 1000; // a saved route is reused this long while the rider stays on it
const OFF_ROUTE_METERS = 150; // further than this from the saved line -> fetch a new route
const CACHE_MAX = 500;

const cache = new Map(); // key -> { route, expiresAt }

const isPoint = (p) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude);

// Distance in metres between two points
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const rad = (d) => (d * Math.PI) / 180;
    const a =
        Math.sin(rad(lat2 - lat1) / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

// Road route between two points, or null if OSRM fails (tracking must still work without it).
// path is a list of [lng, lat] points, the order MapLibre and GeoJSON expect.
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
            path: route.geometry.coordinates, // [lng, lat], same as OSRM returns it
        };
    } catch {
        return null;
    }
};

// Where is the rider on a saved route? Returns the route cut to start at the rider,
// with the remaining distance and ETA worked out here (no OSRM call).
const progressOnRoute = (route, rider) => {
    let nearest = 0;
    let nearestMeters = Infinity;
    route.path.forEach(([lng, lat], i) => {
        const meters = haversine(rider.latitude, rider.longitude, lat, lng);
        if (meters < nearestMeters) {
            nearestMeters = meters;
            nearest = i;
        }
    });

    let remaining = nearestMeters;
    for (let i = nearest; i < route.path.length - 1; i += 1) {
        remaining += haversine(route.path[i][1], route.path[i][0], route.path[i + 1][1], route.path[i + 1][0]);
    }

    const secondsPerMeter = route.distanceMeters > 0 ? route.durationSeconds / route.distanceMeters : 0;
    return {
        offRouteMeters: nearestMeters,
        route: {
            distanceMeters: Math.round(remaining),
            durationSeconds: Math.round(remaining * secondsPerMeter),
            path: [[rider.longitude, rider.latitude], ...route.path.slice(nearest)],
        },
    };
};

// Cached per order, leg and destination, so a changed address gets a new route
// and rider-to-kitchen and rider-to-customer routes never mix.
const getCachedRoute = async (orderNumber, leg, from, to) => {
    if (!isPoint(from) || !isPoint(to)) return null;

    const key = `${orderNumber}:${leg}:${to.latitude},${to.longitude}`;
    const hit = cache.get(key);

    if (hit && hit.expiresAt > Date.now()) {
        const progress = progressOnRoute(hit.route, from);
        if (progress.offRouteMeters <= OFF_ROUTE_METERS) return progress.route;
    }

    const route = await getRoadRoute(from, to);
    if (route) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(key, { route, expiresAt: Date.now() + CACHE_TTL_MS });
        return route;
    }

    // OSRM failed: use the last saved route instead of showing nothing
    return hit ? progressOnRoute(hit.route, from).route : null;
};

export { getRoadRoute, getCachedRoute };