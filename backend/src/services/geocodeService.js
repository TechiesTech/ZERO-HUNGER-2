import AppError from '../utils/appError.js';

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY || '';
const NOMINATIM_URL = (process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org').replace(/\/+$/, '');
const USER_AGENT = process.env.GEOCODER_USER_AGENT || 'ZeroHungerBackend/1.0';

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

const addressParts = (result) => ({
    addressLine1: [result.housenumber, result.street].filter(Boolean).join(' '),
    area: result.suburb || result.district || result.neighbourhood || '',
    city: result.city || result.town || result.village || result.county || '',
    state: result.state || '',
    pincode: result.postcode || '',
});

const reverseGeocode = async ({ latitude, longitude }) => {
    if (GEOAPIFY_KEY) {
        const params = new URLSearchParams({
            format: 'json',
            lat: String(latitude),
            lon: String(longitude),
            apiKey: GEOAPIFY_KEY,
        });
        const result = (await fetchJson(`https://api.geoapify.com/v1/geocode/reverse?${params}`))?.results?.[0];
        if (!result) return null;
        return { ...addressParts(result), formatted: result.formatted || '' };
    }

    const params = new URLSearchParams({
        format: 'jsonv2',
        zoom: '18',
        addressdetails: '1',
        lat: String(latitude),
        lon: String(longitude),
    });
    const data = await fetchJson(`${NOMINATIM_URL}/reverse?${params}`);
    const address = data?.address;
    if (!address) return null;
    return {
        addressLine1: [address.house_number, address.road].filter(Boolean).join(' '),
        area: address.suburb || address.neighbourhood || address.city_district || '',
        city: address.city || address.town || address.village || address.state_district || '',
        state: address.state || '',
        pincode: address.postcode || '',
        formatted: data.display_name || '',
    };
};

export { reverseGeocode };
