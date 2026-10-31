import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Clock, MapPin, Navigation, Phone, Star, Truck, X, Loader2, CheckCircle2 } from 'lucide-react';
import { trackLiveOrder } from '../services/trackingService';

const scooterIcon = L.divIcon({
  html: `<div style="background: #0095f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 17l2-4 3 4 4-5 5 4"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const locationIcon = L.divIcon({
  html: `<div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const restaurantIcon = L.divIcon({
  html: `<div style="background: #f97316; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 3h18v18H3zM12 8v8M8 12h8"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export function ZeptoTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string>('--');
  const [eta, setEta] = useState<string>('--');

  const orderNumber = orderId || 'ZH-ORD-ABC123';
  const customerEmail = 'philip@zerohunger.org';

  const restaurantLocation: [number, number] = [17.4326, 78.4071];

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await trackLiveOrder(orderNumber, customerEmail);
        setTracking(res.data);
        
        if (res.data.customerMealStatus === 'outfordelivery') {
          setRiderLocation({ lat: 17.4400, lng: 78.3900 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [orderNumber, customerEmail]);

  useEffect(() => {
    if (riderLocation && tracking?.destination) {
      fetchRoute(riderLocation, tracking.destination);
    }
  }, [riderLocation, tracking]);

  const fetchRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setRoute(coords);
        setDistance(`${(data.routes[0].distance / 1000).toFixed(1)} km`);
        setEta(`${Math.ceil(data.routes[0].duration / 60)} mins`);
      }
    } catch (err) {
      console.error('Route fetch error:', err);
    }
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'outfordelivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.key === tracking?.customerMealStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-700 rounded-lg">
            <X size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Live Tracking</h1>
            <p className="text-xs opacity-90">Order #{tracking?.orderNumber?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{eta}</p>
          <p className="text-xs opacity-90">ETA</p>
        </div>
      </div>

      <div className="h-[50vh]">
        <MapContainer center={[17.4326, 78.4071]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
          <Marker position={restaurantLocation} icon={restaurantIcon} />
          {tracking?.destination && (
            <Marker position={[tracking.destination.latitude, tracking.destination.longitude]} icon={locationIcon} />
          )}
          {riderLocation && tracking?.customerMealStatus === 'outfordelivery' && (
            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={scooterIcon} />
          )}
          {route.length > 0 && tracking?.customerMealStatus === 'outfordelivery' && (
            <Polyline positions={route} color="#0095f6" weight={5} />
          )}
        </MapContainer>
      </div>

      <div className="p-4 border-t">
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-3">Delivery Status</h3>
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
                        isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Truck size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Rahul Kumar</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-yellow-400 fill-yellow-400" />)}
              <span className="text-xs text-gray-500 ml-1">4.8</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg font-medium">
            <Phone size={18} />
            <span>Call</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium">
            <Navigation size={18} />
            <span>Navigate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
