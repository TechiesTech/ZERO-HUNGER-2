import type { TrackingCoordinates } from "../../services/trackingService";

export function formatCoordinates(
  location:
    | { latitude: number | null; longitude: number | null }
    | null
    | undefined,
) {
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return "Coordinates not provided";
  }
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

export function hasCoordinates(
  location: TrackingCoordinates | null | undefined,
): location is TrackingCoordinates & { latitude: number; longitude: number } {
  return Boolean(
    location &&
      typeof location.latitude === "number" &&
      typeof location.longitude === "number" &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180,
  );
}
