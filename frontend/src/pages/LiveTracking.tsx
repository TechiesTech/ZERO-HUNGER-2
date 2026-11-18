<<<<<<< Updated upstream
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
=======
/**
 * frontend/src/pages/LiveTracking.tsx
 * Live order tracking page with Leaflet maps
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { useLiveTracking } from '../hooks/useLiveTracking';
import L from 'leaflet';
>>>>>>> Stashed changes
import { Clock, MapPin, Navigation, Phone, Star, Truck, X, Loader2 } from 'lucide-react';
import { OrderTrackingMap } from '../components/OrderTrackingMap';
import { useLiveTracking } from '../hooks/useLiveTracking';
import { cancelOrder } from '../services/orderService';
import { formatAddressText } from '../services/trackingService';

interface LiveTrackingProps {
  orderNumber?: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Order Confirmed',
  preparing: 'Preparing',
  readyforpickup: 'Ready for Pickup',
  outfordelivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatEta(estimatedDeliveryAt: string | null): string {
  if (!estimatedDeliveryAt) return 'Not available';
  const timestamp = new Date(estimatedDeliveryAt).getTime();
  if (!Number.isFinite(timestamp)) return 'Not available';
  const diffMins = Math.ceil((timestamp - Date.now()) / 60000);
  return diffMins > 0 ? `${diffMins} mins` : 'Arriving soon';
}

export function LiveTracking({ orderNumber: propOrderNumber }: LiveTrackingProps): React.ReactElement {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const orderNumber = propOrderNumber || paramOrderNumber || '';
  const { tracking, loading, error, refreshWarning, refetch } = useLiveTracking(orderNumber);
  const [actionError, setActionError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!tracking?.canCancel || !window.confirm(`Cancel order ${tracking.orderNumber}?`)) return;
    setCancelling(true);
    setActionError('');
    try {
      await cancelOrder(tracking.orderNumber);
      await refetch();
    } catch (cancelError) {
      setActionError(cancelError instanceof Error ? cancelError.message : 'Could not cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !tracking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!tracking && error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4"><X size={48} className="mx-auto" /></div>
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

  if (!tracking) return <div className="min-h-screen" role="status">Loading tracking information...</div>;

  const currentStatus = tracking.customerMealStatus;
  const timeline = tracking.timeline || [];
  const riderHasLocation = !tracking.rider?.isLocationStale &&
    tracking.rider?.currentLocation?.latitude != null &&
    tracking.rider.currentLocation.longitude != null;
  const route = currentStatus === 'outfordelivery'
    ? tracking.routes?.toCustomer
    : tracking.routes?.toKitchen || tracking.routes?.toCustomer;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Go back">
            <X size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Live Tracking</h1>
            <p className="text-sm text-gray-500">Order #{tracking.orderNumber.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="lg:flex lg:h-[calc(100vh-64px)]">
        <div className="lg:w-2/3">
          <div className="w-full h-[50vh] lg:h-full">
            <OrderTrackingMap tracking={tracking} />
          </div>
        </div>

        <div className="lg:w-1/3 bg-white border-l border-gray-200 overflow-y-auto">
          {(refreshWarning || actionError) && (
            <div role="status" className="m-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {actionError || refreshWarning}
            </div>
          )}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentStatus === 'delivered' || currentStatus === 'cancelled' ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-sm font-medium text-gray-800">
                  {STATUS_LABELS[currentStatus] || currentStatus}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-500">{formatEta(tracking.estimatedDeliveryAt)}</p>
                <p className="text-xs text-gray-500">Estimated Arrival</p>
              </div>
            </div>

            <ol className="space-y-3">
              {timeline.map((step, index) => {
                const isCurrent = step.status === currentStatus;
                const complete = Boolean(step.at);
                return (
                  <li key={`${step.status}-${index}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${complete ? 'bg-green-500' : 'bg-gray-200'}`}>
                      {step.status === 'outfordelivery'
                        ? <Truck size={16} className={complete ? 'text-white' : 'text-gray-400'} />
                        : step.status === 'delivered'
                          ? <MapPin size={16} className={complete ? 'text-white' : 'text-gray-400'} />
                          : <Clock size={16} className={complete ? 'text-white' : 'text-gray-400'} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-green-600' : complete ? 'text-gray-800' : 'text-gray-400'}`}>
                        {STATUS_LABELS[step.status] || step.status}
                      </p>
                      {step.at && <p className="text-xs text-gray-500">{new Date(step.at).toLocaleString()}</p>}
                      {isCurrent && !step.at && <p className="text-xs text-gray-500">In Progress</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Kitchen</div>
                <p className="font-semibold text-gray-800">{tracking.kitchen?.name || 'Kitchen'}</p>
                <p className="text-sm text-gray-600">{formatAddressText(tracking.kitchen?.address) || 'Kitchen address unavailable'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Navigation size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Destination</div>
                <p className="font-semibold text-gray-800">{tracking.customerName || 'Customer'}</p>
                <p className="text-sm text-gray-600">
                  {tracking.destination
                    ? `${tracking.destination.latitude}, ${tracking.destination.longitude}`
                    : 'Address unavailable'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Truck size={18} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Delivery Partner</div>
                {tracking.rider ? (
                  <>
                    <p className="font-semibold text-gray-800">{tracking.rider.name || 'Rider'}</p>
                    <p className="text-sm text-gray-600">
                      {tracking.rider.vehicleType || 'Vehicle'} · {tracking.rider.vehicleNumber || 'N/A'}
                    </p>
                    {!riderHasLocation && <p className="text-sm text-amber-700">Rider location unavailable</p>}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">A rider has not been assigned yet.</p>
                )}
              </div>
            </div>

            {route?.distanceMeters != null && (
              <p className="text-sm text-gray-600">
                Route distance: {(route.distanceMeters / 1000).toFixed(1)} km
              </p>
            )}
            {!route && <p className="text-sm text-gray-500">Route is temporarily unavailable.</p>}

            <div className="flex gap-2">
              {tracking.rider?.phone ? (
                <a href={`tel:${tracking.rider.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-lg font-medium">
                  <Phone size={18} /><span>Call</span>
                </a>
              ) : (
                <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-300 text-white rounded-lg font-medium">
                  <Phone size={18} /><span>Call</span>
                </button>
              )}
              <a
                href={tracking.destination
                  ? `https://www.google.com/maps/dir/?api=1&destination=${tracking.destination.latitude},${tracking.destination.longitude}`
                  : 'https://www.google.com/maps'}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                <Navigation size={18} /><span>Navigate</span>
              </a>
            </div>

            {(tracking.canEditDetails || tracking.canCancel) && (
              <div className="flex gap-2">
                {tracking.canEditDetails && (
                  <Link
                    to={`/track-order?orderNumber=${encodeURIComponent(tracking.orderNumber)}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    Edit address
                  </Link>
                )}
                {tracking.canCancel && (
                  <button
                    onClick={() => void handleCancel()}
                    disabled={cancelling}
                    className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel order'}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span>Live route updates every 5 seconds.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
