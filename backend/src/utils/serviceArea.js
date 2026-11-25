const toRad = (degrees) => (degrees * Math.PI) / 180;

// Straight-line distance in km between two { latitude, longitude } points
const distanceKm = (from, to) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

// Is this address inside the kitchen's delivery radius?
const checkServiceArea = (kitchen, address) => {
    const radiusKm = kitchen?.serviceRadiusKm ?? 5;
    const from = kitchen?.location;
    const to = address?.location;

    if (from?.latitude == null || to?.latitude == null) {
        return { deliverable: false, distanceKm: null, radiusKm };
    }

    const distance = distanceKm(from, to);
    return { deliverable: distance <= radiusKm, distanceKm: Math.round(distance * 10) / 10, radiusKm };
};

export { checkServiceArea };