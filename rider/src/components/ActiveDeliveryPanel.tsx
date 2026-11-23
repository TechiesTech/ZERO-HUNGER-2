import React from 'react';
import { Phone, ExternalLink, MapPin, Store, CheckCircle, PackageCheck, Camera, Clock } from 'lucide-react';
import type { ActiveDelivery } from '../types/rider';

interface ActiveDeliveryPanelProps {
  delivery: ActiveDelivery;
  onMarkPickedUp: () => void;
  onReleaseOrder?: () => void;
  onOpenDeliveryProof: () => void;
  isLoading?: boolean;
  etaMinutes?: number | null;
}

// Helper function to safely convert address to string
const addressToString = (address: any): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.area,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  }
  return String(address);
};

export const ActiveDeliveryPanel: React.FC<ActiveDeliveryPanelProps> = ({
  delivery,
  onMarkPickedUp,
  onReleaseOrder,
  onOpenDeliveryProof,
  isLoading,
  etaMinutes,
}) => {
  const isPickedUp = delivery.customerMealStatus === 'outfordelivery';

  const destinationCoords = isPickedUp
    ? delivery.deliveryAddress?.location
    : delivery.kitchen?.location;

  const destinationAddress = isPickedUp
    ? addressToString(delivery.deliveryAddress)
    : addressToString(delivery.kitchen?.address);

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
    if (phoneNumber && phoneNumber.trim()) {
      window.location.href = `tel:${phoneNumber.trim()}`;
    }
  };

  // Get phone number from delivery data
  const getPhoneNumber = () => {
    if (isPickedUp) {
      return delivery.customerPhone;
    }
    // Kitchen phone is now properly populated from backend
    return delivery.kitchen?.phone;
  };

  const isArrived = etaMinutes !== null && etaMinutes !== undefined && etaMinutes <= 0;
  const displayEta = etaMinutes && etaMinutes > 0 ? etaMinutes : 4;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      {/* Outer panel card with neon green top border matching the ETA circle */}
      <div className="relative bg-zinc-900 border-t-2 border-[#49E619] rounded-t-3xl shadow-[0_-8px_25px_rgba(73,230,25,0.15),0_-2px_10px_rgba(0,0,0,0.5)] pointer-events-auto">
        {/* Half inside, half outside circular ETA badge */}
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
          <div className="bg-white rounded-full w-[88px] h-[88px] border-4 border-[#49E619] shadow-[0_4px_22px_rgba(0,0,0,0.35),0_0_15px_rgba(73,230,25,0.45)] flex flex-col items-center justify-center p-1">
            {isArrived ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#49E619]/20 flex items-center justify-center mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2cb606]" />
                </div>
                <span className="text-xs font-black text-zinc-950 uppercase tracking-tight">arrived</span>
                <span className="text-[8px] font-bold text-zinc-500 leading-none mt-0.5">at location</span>
              </div>
            ) : (
              <>
                <span className="text-[10px] font-medium text-zinc-500 lowercase tracking-tight">arriving in</span>
                <span className="text-3xl font-black text-zinc-900 leading-none my-0.5">{displayEta}</span>
                <span className="text-xs font-bold text-zinc-700 leading-none">mins</span>
              </>
            )}
          </div>
        </div>

        {/* Scrollable content container with top spacing for the floating badge */}
        <div className="p-4 pt-12 pb-safe space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Header Info - Positioned cleanly below the circular timer */}
          <div className="flex items-center justify-between min-h-[32px] pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#49E619] bg-[#49E619]/10 px-2.5 py-1 rounded-md">
                #{delivery.orderNumber}
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-medium">{delivery.items?.length || delivery.sponsoredMealsCount || 1} items</span>
            </div>
            <span className="text-base font-black text-white">₹{delivery.totalAmountInr}</span>
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
                Landmark: {typeof delivery.deliveryAddress.landmark === 'string' ? delivery.deliveryAddress.landmark : ''}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions: Call + Google Maps */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
          <button
            onClick={() => handleCall(getPhoneNumber())}
            className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-bold text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-2"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call</span>
          </button>

          <button
            onClick={handleOpenGoogleMaps}
            className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-bold text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>Maps</span>
          </button>
        </div>
      </div>

      {/* Release Order Button (only before pickup) */}
      {!isPickedUp && onReleaseOrder && (
        <button
          onClick={onReleaseOrder}
          disabled={isLoading}
          className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-transform"
        >
          <span>Release Order</span>
        </button>
      )}

      {/* Compact Action Buttons */}
      {!isPickedUp ? (
        <button
          onClick={onMarkPickedUp}
          disabled={isLoading}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 active:scale-98 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform"
        >
          <PackageCheck className="w-4 h-4 shrink-0" />
          <span>{isLoading ? 'Confirming...' : 'Confirm Pickup'}</span>
        </button>
      ) : (
        <button
          onClick={onOpenDeliveryProof}
          disabled={isLoading}
          className="w-full h-12 bg-[#49E619] hover:bg-[#3ED016] active:scale-98 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#49E619]/20 transition-transform"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>{isLoading ? 'Processing...' : 'Mark Delivered'}</span>
        </button>
      )}
        </div>
      </div>
    </div>
  );
};

