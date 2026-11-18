import React from 'react';
import { Phone, ExternalLink, MapPin, Store, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import type { ActiveDelivery } from '../types/rider';

interface ActiveDeliveryPanelProps {
  delivery: ActiveDelivery;
  onMarkPickedUp: () => void;
  onOpenDeliveryProof: () => void;
  isLoading?: boolean;
}

export const ActiveDeliveryPanel: React.FC<ActiveDeliveryPanelProps> = ({
  delivery,
  onMarkPickedUp,
  onOpenDeliveryProof,
  isLoading,
}) => {
  const isPickedUp = delivery.customerMealStatus === 'outfordelivery';

  const destinationCoords = isPickedUp
    ? delivery.deliveryAddress?.location
    : delivery.kitchen?.location;

  const destinationAddress = isPickedUp
    ? `${delivery.deliveryAddress?.addressLine1}, ${delivery.deliveryAddress?.area}`
    : delivery.kitchen?.address;

  const handleOpenGoogleMaps = () => {
    if (destinationCoords?.latitude && destinationCoords?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destinationCoords.latitude},${destinationCoords.longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress || '')}`,
        '_blank'
      );
    }
  };

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-2xl p-4 pb-safe space-y-4 max-h-[75vh] overflow-y-auto">
      {/* Drag handle pill */}
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />

      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
            #{delivery.orderNumber}
          </span>
          <p className="text-sm font-black text-white mt-1">
            {isPickedUp ? 'Drop at Customer' : 'Pickup from Kitchen'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-base font-black text-white">₹{delivery.totalAmountInr}</span>
          <p className="text-xs text-zinc-400 font-medium">{delivery.items?.length || 1} items</p>
        </div>
      </div>

      {/* Target Address Card */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isPickedUp ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isPickedUp ? <MapPin className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {isPickedUp ? 'Customer Address' : 'Kitchen Address'}
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              {isPickedUp ? delivery.customerName : delivery.kitchen?.name}
            </p>
            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{destinationAddress}</p>
            {isPickedUp && delivery.deliveryAddress?.landmark && (
              <p className="text-xs text-amber-400/90 font-medium mt-1">
                Landmark: {delivery.deliveryAddress.landmark}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions: Call + Google Maps */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
          <button
            onClick={() => handleCall(isPickedUp ? delivery.customerPhone : delivery.kitchen?.phone)}
            className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-bold text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call {isPickedUp ? 'Customer' : 'Kitchen'}</span>
          </button>

          <button
            onClick={handleOpenGoogleMaps}
            className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-bold text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* Main Single Bottom Thumb Action Button (48px+ tall, full width) */}
      {!isPickedUp ? (
        <button
          onClick={onMarkPickedUp}
          disabled={isLoading}
          className="w-full h-14 bg-amber-500 hover:bg-amber-600 active:scale-98 text-zinc-950 font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-transform"
        >
          <PackageCheck className="w-5 h-5 shrink-0" />
          <span>{isLoading ? 'CONFIRMING...' : 'CONFIRM PICKED UP'}</span>
        </button>
      ) : (
        <button
          onClick={onOpenDeliveryProof}
          disabled={isLoading}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-zinc-950 font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-transform"
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>MARK DELIVERED (PHOTO PROOF)</span>
        </button>
      )}
    </div>
  );
};

