import React, { useCallback, useEffect, useRef, useState } from 'react';
// maplibre-gl v4 uses named ESM exports (no default). Import everything by name.
// CSS is loaded from CDN in index.html — do NOT import it here.
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  GeoJSONSource,
} from 'maplibre-gl';
import type { Map as MapLibreMapType, StyleSpecification } from 'maplibre-gl';
import { LocateFixed } from 'lucide-react';
import type { Coordinates } from '../types/rider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapViewProps {
  riderCoords: Coordinates | null;
  kitchenCoords?: { latitude: number; longitude: number; name?: string } | null;
  customerCoords?: { latitude: number; longitude: number; address?: string } | null;
  /** Array of [lng, lat] route waypoints from OSRM */
  routePath?: [number, number][] | null;
  statusText?: string;
  gpsError?: string | null;
  eta?: string | null;
}

type MarkerKey = 'rider' | 'kitchen' | 'customer';

// ─── Constants ───────────────────────────────────────────────────────────────

// Hyderabad city centre — used only until device reports a GPS fix
const DEFAULT_CENTER: [number, number] = [78.4867, 17.3850];
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 15;
const ROUTE_SOURCE = 'route-line';
const ROUTE_LAYER = 'route-layer';

// Esri World Light Gray Canvas with static GeoJSON route layer
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 16,
      attribution: '© Esri, HERE, Garmin',
    },
    'route-line': {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
  },
  layers: [
    { id: 'esri-tiles', type: 'raster', source: 'esri' },
    {
      id: 'route-layer',
      type: 'line',
      source: 'route-line',
      layout: {
        'line-join': 'round',
        'line-cap': 'butt',
      },
      paint: {
        'line-color': '#18181b',
        'line-width': 3,
        'line-dasharray': [2, 2],
        'line-opacity': 0.95,
      },
    },
  ],
};

// ─── Arched Curve Generator ──────────────────────────────────────────────────

/**
 * Generates an upward arched bezier curve between start and end coordinates.
 * Gives the smooth curved dashed arc flight path look (like Swiggy / Zepto).
 */
function createArchCurve(
  start: [number, number],
  end: [number, number],
  numPoints = 60
): [number, number][] {
  const lng1 = Number(start[0]);
  const lat1 = Number(start[1]);
  const lng2 = Number(end[0]);
  const lat2 = Number(end[1]);

  if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) return [];

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [[lng1, lat1], [lng2, lat2]];

  const midX = (lng1 + lng2) / 2;
  const midY = (lat1 + lat2) / 2;

  // Perpendicular normal vector (-dy, dx)
  let nx = -dy;
  let ny = dx;
  const len = Math.sqrt(nx * nx + ny * ny) || 1;
  nx /= len;
  ny /= len;

  // Ensure arch always curves upward (northward on map: ny > 0)
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  // If line is nearly vertical, curve towards east
  if (Math.abs(ny) < 0.25) {
    nx = 0.866;
    ny = 0.5;
  }

  // Curvature height proportional to distance between points
  const archHeight = dist * 0.20;
  const ctrlX = midX + nx * archHeight;
  const ctrlY = midY + ny * archHeight;

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const u = 1 - t;
    const lng = u * u * lng1 + 2 * u * t * ctrlX + t * t * lng2;
    const lat = u * u * lat1 + 2 * u * t * ctrlY + t * t * lat2;
    points.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }
  return points;
}

// ─── SVG Marker Factories ────────────────────────────────────────────────────

/** "R" marker for rider (black theme) */
function createRiderMarker(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:32px;height:32px;';

  // Outer pulse ring
  const pulse = document.createElement('div');
  pulse.style.cssText = `
    position:absolute;inset:0;border-radius:9999px;
    background:rgba(0, 0, 0, 0.15);
    animation:riderPulse 2s ease-out infinite;
  `;

  // Circle with "R" text
  const dot = document.createElement('div');
  dot.style.cssText = `
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:28px;height:28px;border-radius:9999px;
    background:#000000;border:3px solid #ffffff;
    box-shadow:0 3px 12px rgba(0, 0, 0, 0.3);
    display:flex;align-items:center;justify-content:center;
    font-weight:bold;font-size:16px;color:white;
  `;
  dot.textContent = 'R';

  wrap.appendChild(pulse);
  wrap.appendChild(dot);
  return wrap;
}

/** Store icon marker for kitchen (black theme) */
function createKitchenMarker(label?: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.title = label || 'Kitchen pickup';
  wrap.style.cssText = `
    width:32px;height:32px;
    display:flex;align-items:center;justify-content:center;
  `;

  // Store icon SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.cssText = 'color:#000000;width:32px;height:32px;';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z');
  svg.appendChild(path);

  wrap.appendChild(svg);
  return wrap;
}

/** Home icon marker for customer (black theme) */
function createCustomerMarker(label?: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.title = label || 'Customer delivery';
  wrap.style.cssText = `
    width:32px;height:32px;
    display:flex;align-items:center;justify-content-center;
  `;

  // Home icon SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.cssText = 'color:#000000;width:32px;height:32px;';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z');
  svg.appendChild(path);

  wrap.appendChild(svg);
  return wrap;
}

// Inject keyframe animation once into the document
let animInjected = false;
function injectPulseAnim() {
  if (animInjected) return;
  animInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes riderPulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      70%  { transform: scale(2.2); opacity: 0;   }
      100% { transform: scale(2.2); opacity: 0;   }
    }
  `;
  document.head.appendChild(style);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MapView: React.FC<MapViewProps> = ({
  riderCoords,
  kitchenCoords,
  customerCoords,
  routePath,
  statusText = 'Live Route View',
  gpsError = null,
  eta = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMapType | null>(null);
  const markersRef = useRef<Partial<Record<MarkerKey, InstanceType<typeof Marker>>>>({});
  const framedRef = useRef<string>('');
  const [isMapReady, setIsMapReady] = useState(false);

  // ── Initialise map ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    injectPulseAnim();

    const map = new MapLibreMap({
      container,
      style: MAP_STYLE,          // raster style — no sprites, no warnings
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
      dragRotate: false,
      touchZoomRotate: true,
    });

    // Minimal zoom control — bottom-right, no compass (matches Zepto)
    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', (e: { error?: { message?: string } }) => {
      console.warn('[MapLibre]', e.error?.message ?? e);
    });

    const onLoad = () => {
      map.resize();

      if (!map.getSource(ROUTE_SOURCE)) {
        map.addSource(ROUTE_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }

      if (!map.getLayer(ROUTE_LAYER)) {
        map.addLayer({
          id: ROUTE_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'butt',
          },
          paint: {
            'line-color': '#18181b',
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      }

      setIsMapReady(true);
    };

    mapRef.current = map;
    map.on('load', onLoad);
    if (map.isStyleLoaded()) {
      onLoad();
    }

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      map.off('load', onLoad);
      Object.values(markersRef.current).forEach((m) => m?.remove());
      markersRef.current = {};
      framedRef.current = '';
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  // ── Update route line ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    let src = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    if (!src && map.isStyleLoaded()) {
      if (!map.getSource(ROUTE_SOURCE)) {
        map.addSource(ROUTE_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
      if (!map.getLayer(ROUTE_LAYER)) {
        map.addLayer({
          id: ROUTE_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'butt',
          },
          paint: {
            'line-color': '#18181b',
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      }
      src = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    }
    if (!src) return;

    let routeCoords: [number, number][] = [];

    const riderPos: [number, number] | null = riderCoords
      ? [Number(riderCoords.longitude), Number(riderCoords.latitude)]
      : null;

    // Destination: customer after pickup, kitchen before pickup
    const destPos: [number, number] | null = customerCoords
      ? [Number(customerCoords.longitude), Number(customerCoords.latitude)]
      : kitchenCoords
        ? [Number(kitchenCoords.longitude), Number(kitchenCoords.latitude)]
        : null;

    if (
      riderPos &&
      destPos &&
      !isNaN(riderPos[0]) &&
      !isNaN(riderPos[1]) &&
      !isNaN(destPos[0]) &&
      !isNaN(destPos[1])
    ) {
      // Arched curved dashed line from Rider to Kitchen (before pickup), or Rider to Customer (after pickup)
      routeCoords = createArchCurve(riderPos, destPos, 60);
    } else if (routePath) {
      routeCoords = routePath;
    }

    src.setData({
      type: 'FeatureCollection',
      features:
        routeCoords.length >= 2
          ? [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoords,
              },
            },
          ]
          : [],
    });

    map.triggerRepaint();
  }, [
    riderCoords?.latitude,
    riderCoords?.longitude,
    kitchenCoords?.latitude,
    kitchenCoords?.longitude,
    customerCoords?.latitude,
    customerCoords?.longitude,
    routePath,
    statusText,
    isMapReady,
  ]);

  // ── Update markers + re-frame ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    type MarkerSpec = {
      key: MarkerKey;
      coords: { latitude: number; longitude: number } | null | undefined;
      createEl: () => HTMLElement;
    };

    const specs: MarkerSpec[] = [
      {
        key: 'rider',
        coords: riderCoords,
        createEl: () => createRiderMarker(),
      },
      {
        key: 'kitchen',
        coords: kitchenCoords,
        createEl: () => createKitchenMarker(kitchenCoords?.name),
      },
      {
        key: 'customer',
        coords: customerCoords,
        createEl: () => createCustomerMarker(customerCoords?.address),
      },
    ];

    const points: [number, number][] = [];

    specs.forEach(({ key, coords, createEl }) => {
      const existing = markersRef.current[key];

      if (!coords) {
        existing?.remove();
        delete markersRef.current[key];
        return;
      }

      const pos: [number, number] = [coords.longitude, coords.latitude];
      points.push(pos);

      if (existing) {
        existing.setLngLat(pos);
      } else {
        markersRef.current[key] = new Marker({ element: createEl(), anchor: 'bottom' })
          .setLngLat(pos)
          .addTo(map);
      }
    });

    // Re-frame only when visible pin set changes
    const sig = specs.map(({ coords }) => (coords ? '1' : '0')).join('');
    if (!points.length || sig === framedRef.current) return;
    framedRef.current = sig;

    if (points.length === 1) {
      map.easeTo({ center: points[0], zoom: FOCUS_ZOOM, duration: 900 });
    } else {
      const bounds = new LngLatBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { padding: { top: 80, bottom: 160, left: 48, right: 48 }, maxZoom: 16, duration: 900 });
    }
  }, [riderCoords, kitchenCoords, customerCoords, isMapReady]);

  // ── Recenter handler ────────────────────────────────────────────────────────
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (riderCoords) {
      map.easeTo({ center: [riderCoords.longitude, riderCoords.latitude], zoom: FOCUS_ZOOM, duration: 700 });
    } else {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 700 });
    }
  }, [riderCoords]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const hasDelivery = !!(kitchenCoords || customerCoords);

  return (
    <div className="relative w-full h-[52vh] min-h-80 overflow-hidden bg-zinc-200">
      {/* MapLibre canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Top-left: status pill ── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
                      border border-zinc-200 rounded-full px-3 py-1.5 shadow-md pointer-events-none">
        {/* Green / amber live dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${riderCoords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
          }`} />
        <span className="text-[11px] font-semibold text-zinc-800 tracking-tight">{statusText}</span>
      </div>

      {/* ── Top-right: recenter button (Google Maps style) ── */}
      <button
        type="button"
        onClick={handleRecenter}
        aria-label="Centre map on my location"
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white shadow-md
                   border border-zinc-200 flex items-center justify-center
                   text-zinc-600 hover:text-violet-600 active:scale-95 transition-all"
      >
        <LocateFixed className="w-4 h-4" />
      </button>

      {/* ── Bottom: GPS error only (hidden when GPS is working) ── */}
      {gpsError && (
        <div className="absolute bottom-3 left-3 right-14 z-10 pointer-events-none">
          <div className="bg-rose-500/10 backdrop-blur-md rounded-2xl px-4 py-3
                          border border-rose-500/30 shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
              <LocateFixed className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-rose-300">Location unavailable</p>
              <p className="text-[10px] text-rose-400/80 mt-0.5 truncate">{gpsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Marker legend removed ── */}
    </div>
  );
};
