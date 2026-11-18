import React from 'react';
import { Navigation, Store, MapPin, Compass } from 'lucide-react';
import type { Coordinates } from '../types/rider';

interface MapViewProps {
  riderCoords: Coordinates | null;
  kitchenCoords?: { latitude: number; longitude: number; name?: string } | null;
  customerCoords?: { latitude: number; longitude: number; address?: string } | null;
  statusText?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  riderCoords,
  kitchenCoords,
  customerCoords,
  statusText = 'Live Route View',
}) => {
  return (
    <div className="relative w-full h-[48vh] min-h-[300px] bg-zinc-950 overflow-hidden border-b border-zinc-800">
      {/* Map visual canvas simulation / container for Leaflet/MapLibre */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Center Radar / Compass Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-md">
        <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span className="text-xs font-mono font-bold text-zinc-300">{statusText}</span>
      </div>

      {/* Map Pins / Coordinates Status Box */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 space-y-1 shadow-lg max-w-[260px]">
        {riderCoords ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              GPS: {riderCoords.latitude.toFixed(4)}, {riderCoords.longitude.toFixed(4)}
            </span>
          </div>
        ) : (
          <div className="text-zinc-500">Searching for GPS fix...</div>
        )}

        {kitchenCoords && (
          <div className="flex items-center gap-2 text-amber-400">
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Kitchen: {kitchenCoords.name || 'Pickup'}</span>
          </div>
        )}

        {customerCoords && (
          <div className="flex items-center gap-2 text-sky-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Drop: {customerCoords.address || 'Customer'}</span>
          </div>
        )}
      </div>

      {/* Visual Simulated Route Node */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 animate-ping absolute -inset-2" />
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Navigation className="w-6 h-6 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};

