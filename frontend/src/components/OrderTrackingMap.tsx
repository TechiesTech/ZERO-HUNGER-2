import { useEffect, useRef, useState } from 'react';
import { maplibregl } from '../services/mapLibre';
import type { LngLatLike, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TrackingCoordinates, TrackingData, TrackingRoute } from '../services/trackingService';

interface OrderTrackingMapProps {
  tracking: TrackingData;
}

const HYDERABAD_CENTER: [number, number] = [78.4867, 17.385];
const ROUTES = [
  { id: 'to-kitchen', color: '#f59e0b' },
  { id: 'to-customer', color: '#0095f6' },
] as const;

type ValidTrackingCoordinates = TrackingCoordinates & { latitude: number; longitude: number };

function hasPoint(point?: TrackingCoordinates | null): point is ValidTrackingCoordinates {
  return point?.latitude != null &&
    point.longitude != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude);
}

function markerElement(type: 'kitchen' | 'customer' | 'rider', heading?: number | null): HTMLDivElement {
  const outer = document.createElement('div');
  outer.style.cssText = 'width:42px;height:42px;display:grid;place-items:center';
  const inner = document.createElement('div');
  const color = type === 'kitchen' ? '#f97316' : type === 'customer' ? '#22c55e' : '#0095f6';
  inner.style.cssText = `width:38px;height:38px;border:3px solid white;border-radius:50%;background:${color};box-shadow:0 2px 8px rgba(0,0,0,.35);display:grid;place-items:center;color:white;transform:rotate(${heading ?? 0}deg);`;
  inner.innerHTML = type === 'kitchen'
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM12 8v8M8 12h8"/></svg>'
    : type === 'customer'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
      : '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17l2-4 3 4 4-5 5 4"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
  outer.append(inner);
  return outer;
}

function routeFeature(route: TrackingRoute) {
  const coordinates = route.path?.filter(([longitude, latitude]) =>
    Number.isFinite(longitude) && Number.isFinite(latitude),
  );
  if (!coordinates || coordinates.length < 2) return null;
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates,
    },
  };
}

export function OrderTrackingMap({ tracking }: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, MapLibreMarker>());
  const animationRef = useRef(new Map<string, number>());
  const hasLoadedRef = useRef(false);
  const hasFitRef = useRef(false);
  const lastFitStatusRef = useRef<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: HYDERABAD_CENTER,
      zoom: 12,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => {
      hasLoadedRef.current = true;
      setMapLoaded(true);
    });
    mapRef.current = map;

    return () => {
      animationRef.current.forEach((frame) => cancelAnimationFrame(frame));
      animationRef.current.clear();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      hasLoadedRef.current = false;
      hasFitRef.current = false;
      lastFitStatusRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !hasLoadedRef.current) return;

    const pointsForBounds: LngLatLike[] = [];
    const updateMarker = (
      key: string,
      kind: 'kitchen' | 'customer' | 'rider',
      point: TrackingCoordinates | null | undefined,
      heading?: number | null,
    ) => {
      const current = markersRef.current.get(key);
      if (!hasPoint(point)) {
        animationRef.current.delete(key);
        current?.remove();
        markersRef.current.delete(key);
        return;
      }

      const target: [number, number] = [point.longitude, point.latitude];
      pointsForBounds.push(target);
      if (!current) {
        const marker = new maplibregl.Marker({ element: markerElement(kind, heading), anchor: 'center' })
          .setLngLat(target)
          .addTo(map);
        markersRef.current.set(key, marker);
        return;
      }

      const element = current.getElement().firstElementChild as HTMLDivElement | null;
      if (element && kind === 'rider') element.style.transform = `rotate(${heading ?? 0}deg)`;
      if (kind !== 'rider') {
        current.setLngLat(target);
        return;
      }

      const start = current.getLngLat();
      const from: [number, number] = [start.lng, start.lat];
      if (Math.abs(from[0] - target[0]) < 0.000001 && Math.abs(from[1] - target[1]) < 0.000001) return;
      const previousFrame = animationRef.current.get(key);
      if (previousFrame) cancelAnimationFrame(previousFrame);
      const startTime = performance.now();
      const duration = 1200;
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - progress) ** 3;
        current.setLngLat([
          from[0] + (target[0] - from[0]) * eased,
          from[1] + (target[1] - from[1]) * eased,
        ]);
        if (progress < 1) {
          animationRef.current.set(key, requestAnimationFrame(animate));
        } else {
          animationRef.current.delete(key);
        }
      };
      animationRef.current.set(key, requestAnimationFrame(animate));
    };

    updateMarker('kitchen', 'kitchen', tracking.kitchen?.location);
    updateMarker('customer', 'customer', tracking.destination);
    updateMarker(
      'rider',
      'rider',
      tracking.rider?.isLocationStale ? null : tracking.rider?.currentLocation,
      tracking.rider?.currentLocation?.heading,
    );

    const drawRoute = (id: typeof ROUTES[number]['id'], route?: TrackingRoute | null) => {
      const sourceId = `order-route-${id}`;
      const layerId = `${sourceId}-line`;
      const feature = route ? routeFeature(route) : null;
      if (!feature) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        return;
      }
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(feature);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: feature });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': ROUTES.find((item) => item.id === id)?.color || '#0095f6', 'line-width': 5, 'line-opacity': 0.9 },
        });
      }
      feature.geometry.coordinates.forEach((coordinate) => pointsForBounds.push(coordinate));
    };

    const routeToCustomer = tracking.routes?.toCustomer;
    const routeToKitchen = tracking.customerMealStatus === 'outfordelivery'
      ? null
      : tracking.routes?.toKitchen;
    drawRoute('to-kitchen', routeToKitchen);
    drawRoute('to-customer', routeToCustomer);

    const shouldFit = !hasFitRef.current ||
      (tracking.customerMealStatus === 'outfordelivery' && lastFitStatusRef.current !== 'outfordelivery');
    lastFitStatusRef.current = tracking.customerMealStatus;
    if (shouldFit && tracking.customerMealStatus === 'outfordelivery' && hasPoint(tracking.destination)) {
      const fitPoints: LngLatLike[] = [[tracking.destination.longitude, tracking.destination.latitude]];
      if (!tracking.rider?.isLocationStale && hasPoint(tracking.rider?.currentLocation)) {
        fitPoints.push([tracking.rider.currentLocation.longitude, tracking.rider.currentLocation.latitude]);
      }
      if (fitPoints.length > 1) {
        const bounds = fitPoints.reduce(
          (current, coordinate) => current.extend(coordinate as [number, number]),
          new maplibregl.LngLatBounds(fitPoints[0], fitPoints[0]),
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
        hasFitRef.current = true;
        return;
      }
    }

    if (shouldFit && pointsForBounds.length > 1) {
      const bounds = pointsForBounds.reduce(
        (current, coordinate) => current.extend(coordinate as [number, number]),
        new maplibregl.LngLatBounds(pointsForBounds[0], pointsForBounds[0]),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
      hasFitRef.current = true;
    } else if (shouldFit && pointsForBounds.length === 1) {
      map.flyTo({ center: pointsForBounds[0], zoom: 14, duration: 500 });
      hasFitRef.current = true;
    }
  }, [tracking, mapLoaded]);

  return <div ref={containerRef} className="h-full min-h-[320px] w-full" aria-label="Live delivery map" />;
}
