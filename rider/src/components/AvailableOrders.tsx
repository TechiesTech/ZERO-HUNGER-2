import React from 'react';
import { MapPin, Store, RefreshCw, Plus } from 'lucide-react';
import type { AvailableOrder } from '../types/rider';

// Helper to safely convert address to string
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

interface AvailableOrdersProps {
  orders: AvailableOrder[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onAccept: (orderNumber: string) => void;
  isAccepting?: boolean;
}

export const AvailableOrders: React.FC<AvailableOrdersProps> = ({
  orders,
  isRefreshing,
  onRefresh,
  onAccept,
  isAccepting,
}) => {
  return (
    <div className="p-4 space-y-3 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Available Deliveries</h2>
          <p className="text-xs text-zinc-400">
            {orders.length} order{orders.length === 1 ? '' : 's'} ready for pickup
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center mt-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders nearby right now</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Keep your app open and stay in active kitchen zones. New orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="relative bg-zinc-900 border border-zinc-800 border-t-2 border-t-[#49E619] rounded-2xl p-4 shadow-[0_-4px_20px_rgba(73,230,25,0.12),0_4px_20px_rgba(0,0,0,0.4)]"
            >
              {/* Header - Order # and Amount */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#49E619] bg-[#49E619]/10 px-2 py-1 rounded-md">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400">{order.itemsCount || 1} items</span>
                </div>
                <span className="text-base font-black text-white">₹{order.totalAmountInr}</span>
              </div>

              {/* Route Info - Kitchen to Customer */}
              <div className="bg-zinc-950/50 rounded-xl p-3 mb-3 space-y-2">
                {/* Kitchen */}
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200 truncate">{order.kitchen?.name || 'Cloud Kitchen'}</p>
                    <p className="text-xs text-zinc-500 truncate">{addressToString(order.kitchen?.address)}</p>
                  </div>
                </div>

                {/* Divider line */}
                <div className="flex items-center gap-2 ml-2.5">
                  <div className="w-0.5 h-3 bg-zinc-700 rounded-full" />
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Customer */}
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200">Customer Delivery</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {order.deliveryArea || addressToString(order.deliveryAddress)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button - Compact */}
              <button
                onClick={() => onAccept(order.orderNumber)}
                disabled={isAccepting}
                className="w-full h-11 bg-[#49E619] hover:bg-[#3ED016] active:scale-95 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-transform shadow-md shadow-[#49E619]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Accept</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

