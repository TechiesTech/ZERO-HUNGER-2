import React, { useEffect, useRef, useState } from 'react';
import { maplibregl } from '@/services/mapLibre';
import type { Map as MapLibreMap, Marker as MapLibreMarker, MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlertCircle, Loader2, MapPin, Save } from 'lucide-react';
import { api } from '@/services/adminApi';

interface KitchenAddress {
  addressLine1: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

interface KitchenPoint {
  latitude: number;
  longitude: number;
}

interface KitchenProfileData {
  detailsComplete?: boolean;
  address?: KitchenAddress;
  location?: KitchenPoint;
  serviceRadiusKm?: number;
  isOpen?: boolean;
}

interface GeocodedAddress extends Partial<KitchenAddress> {
  formatted?: string;
}

const EMPTY_ADDRESS: KitchenAddress = {
  addressLine1: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};
const DEFAULT_CENTER: [number, number] = [78.4867, 17.385];

function KitchenMapPicker({
  value,
  onChange,
}: {
  value: KitchenPoint | null;
  onChange: (point: KitchenPoint) => void;
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: value ? [value.longitude, value.latitude] : DEFAULT_CENTER,
      zoom: value ? 15 : 12,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => setLoaded(true));
    map.on('click', (event: MapMouseEvent) => onChangeRef.current({
      latitude: Number(event.lngLat.lat.toFixed(6)),
      longitude: Number(event.lngLat.lng.toFixed(6)),
    }));
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
    if (!map || !loaded) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const coordinates: [number, number] = [value.longitude, value.latitude];
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ draggable: true, color: '#188D44' })
        .setLngLat(coordinates)
        .addTo(map);
      marker.on('dragend', () => {
        const point = marker.getLngLat();
        onChangeRef.current({
          latitude: Number(point.lat.toFixed(6)),
          longitude: Number(point.lng.toFixed(6)),
        });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(coordinates);
    }
    map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 15), duration: 400 });
  }, [loaded, value]);

  return (
    <div>
      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-xl border border-white/10" aria-label="Select kitchen pin on map" />
      <p className="mt-2 text-xs text-white/40">Click the map or drag the marker to set the kitchen pin.</p>
    </div>
  );
}

export function KitchenProfile(): React.ReactElement {
  const [address, setAddress] = useState<KitchenAddress>(EMPTY_ADDRESS);
  const [location, setLocation] = useState<KitchenPoint | null>(null);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    api.get<{ success: boolean; data: KitchenProfileData }>('/api/kitchen/me')
      .then(({ data }) => {
        if (!active) return;
        if (data.address) setAddress({ ...EMPTY_ADDRESS, ...data.address });
        if (data.location) setLocation(data.location);
        if (data.serviceRadiusKm != null) setServiceRadiusKm(data.serviceRadiusKm);
        if (data.isOpen != null) setIsOpen(data.isOpen);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load kitchen details.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handlePin = async (point: KitchenPoint) => {
    setLocation(point);
    setNotice('');
    setError('');
    setGeocoding(true);
    const currentRequest = ++requestId.current;
    try {
      const response = await api.post<{
        success: boolean;
        data: { address: GeocodedAddress | null };
      }>('/api/orders/reverseGeocode', point);
      if (currentRequest !== requestId.current) return;
      const geocoded = response.data.address;
      if (geocoded) {
        setAddress((current) => ({
          ...current,
          area: geocoded.area?.trim() || current.area,
          city: geocoded.city?.trim() || current.city,
          state: geocoded.state?.trim() || current.state,
          pincode: geocoded.pincode?.trim() || current.pincode,
        }));
      } else {
        setNotice('No address was found for this pin. Enter the address manually.');
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(requestError instanceof Error ? `Pin selected, but address lookup failed: ${requestError.message}` : 'Pin selected, but address lookup failed.');
      }
    } finally {
      if (currentRequest === requestId.current) setGeocoding(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!location) {
      setError('Choose the kitchen pin on the map before saving.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.put('/api/kitchen/me', { address, location, serviceRadiusKm, isOpen });
      setNotice('Kitchen details saved.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save kitchen details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-20 text-sm text-white/45"><Loader2 size={16} className="animate-spin" /> Loading kitchen details…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#4EDBE2] font-bold">Kitchen settings</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Kitchen profile</h1>
        <p className="mt-1 text-sm text-white/45">Set the pickup address, map pin, service radius, and whether the kitchen is open.</p>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
      {notice && <p role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">{notice}</p>}

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-white/8 bg-[#0D1719] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Kitchen location</h2>
            <span className="inline-flex items-center gap-1 text-xs text-white/40"><MapPin size={13} />{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Pin not selected'}</span>
          </div>
          <KitchenMapPicker value={location} onChange={(point) => void handlePin(point)} />
          {geocoding && <p className="text-xs text-[#4EDBE2]">Looking up the selected address…</p>}
        </section>

        <section className="space-y-4 rounded-2xl border border-white/8 bg-[#0D1719] p-5">
          <h2 className="font-bold text-white">Address details</h2>
          {([
            ['addressLine1', 'Street / building', true],
            ['area', 'Area', true],
            ['landmark', 'Landmark', false],
            ['city', 'City', true],
            ['state', 'State', true],
            ['pincode', 'PIN code', true],
          ] as const).map(([field, label, required]) => (
            <label key={field} className="block text-xs font-semibold text-white/60">
              {label}
              <input
                required={required}
                maxLength={field === 'addressLine1' ? 200 : field === 'area' || field === 'landmark' ? 100 : 80}
                value={address[field]}
                onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-[#4EDBE2]/60"
              />
            </label>
          ))}
          <label className="block text-xs font-semibold text-white/60">
            Service radius: {serviceRadiusKm} km
            <input type="range" min="0.5" max="50" step="0.5" value={serviceRadiusKm} onChange={(event) => setServiceRadiusKm(Number(event.target.value))} className="mt-2 w-full accent-[#4EDBE2]" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-[#080808] p-3 text-sm text-white/75">
            Accept new orders
            <input type="checkbox" checked={isOpen} onChange={(event) => setIsOpen(event.target.checked)} className="h-4 w-4 accent-[#4EDBE2]" />
          </label>
          <button type="submit" disabled={saving || !location} className="inline-flex items-center gap-2 rounded-lg bg-[#4EDBE2] px-5 py-3 text-sm font-bold text-[#080808] disabled:opacity-40">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save kitchen profile'}
          </button>
        </section>
      </form>
    </div>
  );
}
