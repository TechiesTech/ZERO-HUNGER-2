import { useEffect, useRef } from 'react';
import { maplibregl } from '../services/mapLibre';
import type { Map as MapLibreMap, Marker as MapLibreMarker, MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DeliveryPoint } from '../services/orderService';

interface LocationPickerProps {
  value: DeliveryPoint | null;
  onChange: (point: DeliveryPoint) => void;
  interactive?: boolean;
}

const HYDERABAD_CENTER: [number, number] = [78.4867, 17.385];

export default function LocationPicker({
  value,
  onChange,
  interactive = true,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const interactiveRef = useRef(interactive);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

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
    map.on('click', (event: MapMouseEvent) => {
      if (!interactiveRef.current) return;
      onChangeRef.current({
        latitude: Number(event.lngLat.lat.toFixed(6)),
        longitude: Number(event.lngLat.lng.toFixed(6)),
      });
    });
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      map.flyTo({ center: HYDERABAD_CENTER, zoom: 12 });
      return;
    }

    const position: [number, number] = [value.longitude, value.latitude];
    if (!markerRef.current) {
      const element = document.createElement('div');
      element.className = 'zh-location-pin';
      element.setAttribute('aria-label', 'Delivery location pin');
      element.style.cssText = `width:36px;height:42px;cursor:${interactive ? 'grab' : 'default'};filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))`;
      element.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 24 28" aria-hidden="true">
          <path d="M12 28s9-8.3 9-16a9 9 0 1 0-18 0c0 7.7 9 16 9 16Z" fill="#2A66EA" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="3.25" fill="#fff" />
        </svg>
      `;
      const marker = new maplibregl.Marker({ element, draggable: interactive, anchor: 'bottom' })
        .setLngLat(position)
        .addTo(map);
      markerRef.current = marker;
      marker.on('dragend', () => {
        const point = marker.getLngLat();
        if (!point) return;
        onChangeRef.current({
          latitude: Number(point.lat.toFixed(6)),
          longitude: Number(point.lng.toFixed(6)),
        });
      });
    } else {
      markerRef.current.setLngLat(position);
    }
    map.flyTo({ center: position, zoom: Math.max(map.getZoom(), 15) });
  }, [interactive, value]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-lg border border-[#122023]/20"
        aria-label="Select delivery location on map"
      />
      <p className="text-xs text-[#122023]/60">
        {interactive
          ? 'Click the map or drag the pin to the exact delivery entrance.'
          : value
            ? 'Saved delivery location.'
            : 'No confirmed delivery pin is saved for this address.'}
      </p>
    </div>
  );
}
