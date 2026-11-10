import { useEffect, useRef } from 'react';
import L, { type Marker as LeafletMarker } from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeliveryPoint } from '../services/orderService';

interface LocationPickerProps {
  value: DeliveryPoint | null;
  onChange: (point: DeliveryPoint) => void;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border:3px solid white;border-radius:50%;background:#49e619;box-shadow:0 2px 6px #000"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapClickHandler = ({ onChange }: Pick<LocationPickerProps, 'onChange'>) => {
  useMapEvents({
    click: ({ latlng }) => onChange({
      latitude: Number(latlng.lat.toFixed(6)),
      longitude: Number(latlng.lng.toFixed(6)),
    }),
  });
  return null;
};

const MapCenter = ({ value }: Pick<LocationPickerProps, 'value'>) => {
  const map = useMap();

  useEffect(() => {
    if (value) map.setView([value.latitude, value.longitude], 16);
    else map.setView(INDIA_CENTER, 5);
  }, [map, value]);

  return null;
};

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const markerRef = useRef<LeafletMarker>(null);
  const center: [number, number] = value
    ? [value.latitude, value.longitude]
    : INDIA_CENTER;

  return (
    <div className="space-y-2">
      <MapContainer
        center={center}
        zoom={value ? 16 : 5}
        scrollWheelZoom
        className="h-64 w-full rounded-lg border border-[#122023]/20"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <MapCenter value={value} />
        {value && (
          <Marker
            ref={markerRef}
            position={[value.latitude, value.longitude]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: () => {
                const marker = markerRef.current;
                if (!marker) return;
                const point = marker.getLatLng();
                onChange({
                  latitude: Number(point.lat.toFixed(6)),
                  longitude: Number(point.lng.toFixed(6)),
                });
              },
            }}
          />
        )}
      </MapContainer>
      <p className="text-xs text-[#122023]/60">
        Click the map or drag the pin to the exact delivery entrance.
      </p>
    </div>
  );
}
