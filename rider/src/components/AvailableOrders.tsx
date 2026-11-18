import React from 'react';
import { MapPin, Store, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import type { AvailableOrder } from '../types/rider';

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
        <div className="space-y-3.5">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  #{order.orderNumber}
                </span>
                <span className="text-sm font-black text-white">₹{order.totalAmountInr}</span>
              </div>

              {/* Kitchen Pickup */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200">{order.kitchen?.name || 'Cloud Kitchen'}</p>
                  <p className="text-xs text-zinc-400 truncate">{order.kitchen?.address}</p>
                </div>
              </div>

              {/* Customer Drop */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200">Customer Delivery</p>
                  <p className="text-xs text-zinc-400 truncate">
                    {order.deliveryAddress?.area || order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                  </p>
                </div>
              </div>

              {/* Big 48px Thumb Action Button */}
              <button
                onClick={() => onAccept(order.orderNumber)}
                disabled={isAccepting}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-transform shadow-md shadow-emerald-500/20"
              >
                <span>ACCEPT DELIVERY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

