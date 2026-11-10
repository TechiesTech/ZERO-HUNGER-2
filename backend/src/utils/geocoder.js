import AppError from './appError.js';

const PHOTON_URL = (process.env.PHOTON_URL || 'https://photon.komoot.io').replace(/\/+$/, '');
const USER_AGENT = process.env.GEOCODER_USER_AGENT || 'ZeroHungerBackend/1.0';
const INDIA_BBOX = '68.1,6.7,97.4,35.5'; // minLon,minLat,maxLon,maxLat

// Small in-memory cache so repeated lookups do not hit the free service again
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

const cached = async (key, load) => {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const value = await load();
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
};

const fetchJson = async (url) => {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
        });
        if (!response.ok) throw new AppError('Geocoding provider request failed', 502);
        return await response.json();
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Geocoding provider is unavailable', 502);
    }
};

const toPoint = (latitude, longitude) => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        return null;
    }
    return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
};

// Photon "properties" object -> our address fields
const photonAddress = (p = {}) => ({
    addressLine1: [p.housenumber, p.street].filter(Boolean).join(' '),
    area: p.district || p.locality || '',
    city: p.city || p.county || '',
    state: p.state || '',
    pincode: p.postcode || '',
});

const photonLabel = (p = {}) =>
    [p.name, p.street, p.district, p.city, p.state, p.postcode].filter(Boolean).join(', ');

// { latitude, longitude } -> address, or null
const reverseGeocode = async ({ latitude, longitude }) => {
    const key = `rev:${Number(latitude).toFixed(5)},${Number(longitude).toFixed(5)}`;
    return cached(key, async () => {
        const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), lang: 'en' });
        const data = await fetchJson(`${PHOTON_URL}/reverse?${params}`);
        const p = data?.features?.[0]?.properties;
        if (!p) return null;
        return { ...photonAddress(p), formatted: photonLabel(p) };
    });
};

// Address (text or object) -> { latitude, longitude }, or null
const geocodeAddress = async (address) => {
    const query =
        typeof address === 'string'
            ? address.trim()
            : [address?.addressLine1, address?.area, address?.city, address?.state, address?.pincode]
                  .filter(Boolean)
                  .join(', ');
    if (!query) return null;

    return cached(`geo:${query.toLowerCase()}`, async () => {
        const params = new URLSearchParams({ q: query, limit: '1', lang: 'en', bbox: INDIA_BBOX });
        const data = await fetchJson(`${PHOTON_URL}/api/?${params}`);
        const [lon, lat] = data?.features?.[0]?.geometry?.coordinates || [];
        return toPoint(lat, lon);
    });
};

// Suggestions while typing. Returns [] on any failure so typing never shows an error.
const searchAddresses = async (text) => {
    const query = String(text || '').trim();
    if (query.length < 3) return [];

    try {
        return await cached(`sug:${query.toLowerCase()}`, async () => {
            const params = new URLSearchParams({ q: query, limit: '5', lang: 'en', bbox: INDIA_BBOX });
            const data = await fetchJson(`${PHOTON_URL}/api/?${params}`);
            return (data?.features || [])
                .map((feature) => {
                    const p = feature.properties || {};
                    const [lon, lat] = feature.geometry?.coordinates || [];
                    return { point: toPoint(lat, lon), label: photonLabel(p), address: photonAddress(p) };
                })
                .filter((s) => s.point)
                .map(({ point, label, address }) => ({ label, ...point, address }));
        });
    } catch {
        return [];
    }
};

export { reverseGeocode, geocodeAddress, searchAddresses };