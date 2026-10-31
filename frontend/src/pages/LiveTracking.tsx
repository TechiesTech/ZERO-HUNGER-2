/**
 * frontend/src/pages/LiveTracking.tsx
 * Live order tracking page with Leaflet maps
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveTracking } from '../hooks/useLiveTracking';
import L from 'leaflet';
import { Clock, MapPin, Navigation, Phone, Star, Truck, X, Loader2 } from 'lucide-react';

interface LiveTrackingProps {
  orderNumber?: string;
  customerEmail?: string;
}

export function LiveTracking({ orderNumber: propOrderNumber, customerEmail: propCustomerEmail }: LiveTrackingProps): React.ReactElement {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();

  const orderNumber = propOrderNumber || paramOrderNumber || '';
  const customerEmail = propCustomerEmail || 'philip@zerohunger.org';

  const { tracking, loading, error, refetch } = useLiveTracking(orderNumber, customerEmail);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);

  const [eta, setEta] = useState<string>('Calculating...');

  const fetchRoute = async (from: [number, number], to: [number, number]) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        if (mapInstanceRef.current) {
          polylineRef.current = L.polyline(coords, {
            color: '#FF6B00',
            weight: 5,
            opacity: 0.8,
          }).addTo(mapInstanceRef.current);
        }
      }
    } catch (err) {
      console.error('Route fetch error:', err);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [17.3850, 78.4867],
      zoom: 13,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !tracking || !tracking.destination) return;

    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const restaurantLocation: [number, number] = [17.4326, 78.4071];
    const customerLocation: [number, number] = [tracking.destination.latitude, tracking.destination.longitude];

    const restaurantIcon = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h18v18H3zM12 8v8M8 12h8"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const restaurantMarker = L.marker(restaurantLocation, { icon: restaurantIcon }).addTo(map);
    restaurantMarker.bindPopup('<div class="font-bold">Restaurant</div>');
    markersRef.current.set('restaurant', restaurantMarker);

    const customerIcon = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const customerMarker = L.marker(customerLocation, { icon: customerIcon }).addTo(map);
    customerMarker.bindPopup('<div class="font-bold">Delivery Location</div>');
    markersRef.current.set('customer', customerMarker);

    if (tracking.customerMealStatus === 'outfordelivery') {
      const riderLocation: [number, number] = [17.4400, 78.3900];

      const riderIcon = L.divIcon({
        className: 'bg-transparent border-0',
        html: `
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white shadow-lg animate-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 17l2-4 3 4 4-5 5 4"/>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const riderMarker = L.marker(riderLocation, { icon: riderIcon }).addTo(map);
      riderMarker.bindPopup('<div class="font-bold">Delivery Partner</div>');
      markersRef.current.set('rider', riderMarker);

      fetchRoute(riderLocation, customerLocation);
    }

    const bounds = L.latLngBounds([restaurantLocation, customerLocation]);
    map.fitBounds(bounds, { padding: [50, 50] });

    if (tracking.estimatedDeliveryAt) {
      const estimatedTime = new Date(tracking.estimatedDeliveryAt);
      const now = new Date();
      const diffMs = estimatedTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      setEta(diffMins > 0 ? `${diffMins} mins` : 'Arriving soon');
    } else {
      setEta('Not available');
    }
  }, [tracking]);

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'outfordelivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: MapPin },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.key === tracking?.customerMealStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Tracking Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Live Tracking</h1>
            <p className="text-sm text-gray-500">Order #{tracking?.orderNumber.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="lg:flex lg:h-[calc(100vh-64px)]">
        <div className="lg:w-2/3">
          <div ref={mapRef} className="w-full h-[50vh] lg:h-full" />
        </div>

        <div className="lg:w-1/3 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-800">Live Tracking</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-500">{eta}</p>
                <p className="text-xs text-gray-500">Estimated Arrival</p>
              </div>
            </div>

            <div className="space-y-3">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <Icon size={16} className={isCompleted ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-orange-500' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && <p className="text-xs text-gray-500">In Progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3">Delivery Partner</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck size={24} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Rahul Kumar</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">4.8</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <Phone size={18} />
                <span className="text-sm font-medium">Call</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Navigation size={18} />
                <span className="text-sm font-medium">Navigate</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-gray-800 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="text-gray-800">{tracking?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="text-gray-800">{tracking?.items?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-800">₹{tracking?.totalAmountInr || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sponsored Meals</span>
                <span className="text-green-600 font-medium">{tracking?.sponsoredMealsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
