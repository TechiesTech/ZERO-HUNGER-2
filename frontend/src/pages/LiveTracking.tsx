/**
 * frontend/src/pages/LiveTracking.tsx
 * Live order tracking page with real-time delivery updates
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracking } from '../hooks/useTracking';
import { Clock, MapPin, Navigation, Phone, Star, Truck, X } from 'lucide-react';

interface LiveTrackingProps {
  orderId?: string;
}

export function LiveTracking({ orderId: propOrderId }: LiveTrackingProps): React.ReactElement {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const orderId = propOrderId || paramOrderId || '';
  const navigate = useNavigate();

  const {
    tracking,
    currentLocation,
    loading,
    error,
    startLocationTracking,
    stopLocationTracking,
  } = useTracking(orderId);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [isRiderMode, setIsRiderMode] = useState(false);
  const [eta, setEta] = useState<string>('Calculating...');

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 17.3850, lng: 78.4867 },
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      polylineOptions: {
        strokeColor: '#FF6B00',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !tracking) return;

    const map = mapInstanceRef.current;
    const directionsRenderer = directionsRendererRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    const restaurantLocation = { lat: 17.4326, lng: 78.4071 };
    const customerLocation = { lat: 17.4932, lng: 78.3998 };
    const riderLocation = currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : restaurantLocation;

    const restaurantMarker = new google.maps.Marker({
      position: restaurantLocation,
      map,
      title: 'Restaurant',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#FF6B00',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
    });
    markersRef.current.set('restaurant', restaurantMarker);

    const customerMarker = new google.maps.Marker({
      position: customerLocation,
      map,
      title: 'Delivery Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4CAF50',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
    });
    markersRef.current.set('customer', customerMarker);

    const riderMarker = new google.maps.Marker({
      position: riderLocation,
      map,
      title: 'Delivery Partner',
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 8,
        fillColor: '#2196F3',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: 45,
      },
      animation: google.maps.Animation.DROP,
    });
    markersRef.current.set('rider', riderMarker);

    if (directionsRenderer && tracking.status !== 'delivered') {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: riderLocation,
          destination: customerLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && directionsRenderer) {
            directionsRenderer.setDirections(result);
            const duration = result.routes[0].legs[0].duration;
            setEta(duration.text);
          }
        }
      );
    }

    const bounds = new google.maps.LatLngBounds([
      restaurantLocation,
      customerLocation,
      riderLocation,
    ]);
    map.fitBounds(bounds, { padding: 50 });
  }, [tracking, currentLocation]);

  const handleToggleRiderMode = () => {
    if (isRiderMode) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
    setIsRiderMode(!isRiderMode);
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'picked_up', label: 'Picked Up', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: MapPin },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.key === tracking?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            onClick={() => navigate('/')}
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
            <p className="text-sm text-gray-500">Order #{orderId.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={handleToggleRiderMode}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isRiderMode
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isRiderMode ? 'Stop Tracking' : 'Start Rider Mode'}
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
                <span className="text-gray-500">Items</span>
                <span className="text-gray-800">2x Protein Power Meal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-800">₹300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Address</span>
                <span className="text-gray-800 text-right">Plot 42, Road No. 12, Banjara Hills, Hyderabad</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
