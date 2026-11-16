import { useEffect, useState } from 'react';
import { kitchenApi } from '../services/kitchenApi';
import type { KitchenOrder } from '../types';
import {
  PackageCheck,
  ChefHat,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

type Tab = 'ALL' | 'CONFIRMED' | 'PREPARING' | 'READY';

export function Orders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await kitchenApi.getPaidOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incoming orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStartPreparing = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await kitchenApi.startPreparing(orderId);
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start preparing order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await kitchenApi.markReady(orderId);
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark order ready');
    } finally {
      setActionLoading(null);
    }
  };

  const getOrderStatus = (o: KitchenOrder) => o.status || o.customerMealStatus || 'confirmed';

  const formatAddress = (addr: KitchenOrder['deliveryAddress']): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    return [addr.addressLine1, addr.addressLine2, addr.area, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(', ');
  };

  const filteredOrders = orders.filter((o) => {
    const status = getOrderStatus(o);
    if (activeTab === 'CONFIRMED' && status !== 'confirmed') return false;
    if (activeTab === 'PREPARING' && status !== 'preparing') return false;
    if (activeTab === 'READY' && status !== 'readyforpickup') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o._id.toLowerCase().includes(q);
      const matchAddress = formatAddress(o.deliveryAddress).toLowerCase().includes(q);
      const matchItems = o.items?.some((i) =>
        (i.mealName || i.productName || '').toLowerCase().includes(q)
      );
      return matchId || matchAddress || matchItems;
    }
    return true;
  });

  const confirmedCount = orders.filter((o) => getOrderStatus(o) === 'confirmed').length;
  const preparingCount = orders.filter((o) => getOrderStatus(o) === 'preparing').length;
  const readyCount = orders.filter((o) => getOrderStatus(o) === 'readyforpickup').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Kitchen Order Dispatch</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Manage incoming orders and update fulfillment stages in real time.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Orders
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#0D1719] border border-white/8 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-[#49E619] text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'CONFIRMED'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock size={13} />
            To Prepare ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab('PREPARING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PREPARING'
                ? 'bg-[#4EDBE2] text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ChefHat size={13} />
            Cooking ({preparingCount})
          </button>
          <button
            onClick={() => setActiveTab('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'READY'
                ? 'bg-[#49E619] text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <PackageCheck size={13} />
            Ready for Pickup ({readyCount})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID or items..."
            className="w-full pl-9 pr-4 py-2 bg-[#0D1719] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#49E619]/50 transition-colors"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center bg-[#0D1719] rounded-2xl border border-white/8 text-white/40 text-sm">
          Loading incoming orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[#0D1719] rounded-2xl border border-white/8">
          <CheckCircle2 size={36} className="mx-auto text-[#49E619]/40 mb-3" />
          <p className="text-white font-medium text-sm">No orders found in this view</p>
          <p className="text-white/40 text-xs mt-1">Paid customer orders will appear as soon as they are placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = getOrderStatus(order);
            const isConfirmed = status === 'confirmed';
            const isPreparing = status === 'preparing';
            const isReady = status === 'readyforpickup';

            return (
              <div
                key={order._id}
                className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 hover:border-white/15 transition-all shadow-sm space-y-4"
              >
                {/* Header row: ID, Status, Timestamp, Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular font-bold text-white text-base">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isConfirmed
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isPreparing
                          ? 'bg-[#4EDBE2]/10 text-[#4EDBE2] border border-[#4EDBE2]/20'
                          : 'bg-[#49E619]/10 text-[#49E619] border border-[#49E619]/20'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/50">
                    {order.createdAt && (
                      <span className="flex items-center gap-1 font-mono-tabular">
                        <Calendar size={13} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span className="font-bold text-white text-sm font-mono-tabular">
                      ₹{order.totalAmount ?? order.totalAmountInr ?? 0}
                    </span>
                  </div>
                </div>

                {/* Items and Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Items list */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                      Dishes & Quantity
                    </p>
                    <div className="space-y-1.5">
                      {order.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/30 border border-white/5"
                        >
                          <span className="text-white font-medium">
                            <span className="text-[#49E619] font-bold mr-1.5">{it.quantity}x</span>
                            {it.mealName || it.productName || 'Meal'}
                          </span>
                          <span className="text-white/60 font-mono-tabular">
                            ₹{it.priceAtOrder || it.price || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer / Delivery note */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                      Delivery Destination
                    </p>
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-white/70 space-y-1.5">
                      <p className="flex items-start gap-1.5">
                        <MapPin size={14} className="shrink-0 mt-0.5 text-white/40" />
                        <span>{formatAddress(order.deliveryAddress) || 'Standard delivery address'}</span>
                      </p>
                      {(order.customerName || order.user?.name) && (
                        <p className="text-[11px] text-white/40 pl-5">
                          Ordered by {order.customerName || order.user?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-2 flex justify-end items-center gap-3">
                  {isConfirmed && (
                    <button
                      onClick={() => handleStartPreparing(order._id)}
                      disabled={actionLoading === order._id}
                      className="px-5 py-2.5 rounded-xl bg-[#4EDBE2] hover:bg-[#3ec4cb] text-black font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#4EDBE2]/10"
                    >
                      {actionLoading === order._id ? 'Updating...' : 'Start Preparing'}
                    </button>
                  )}
                  {isPreparing && (
                    <button
                      onClick={() => handleMarkReady(order._id)}
                      disabled={actionLoading === order._id}
                      className="px-5 py-2.5 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-black font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#49E619]/10"
                    >
                      {actionLoading === order._id ? 'Updating...' : 'Mark Ready for Pickup'}
                    </button>
                  )}
                  {isReady && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#49E619] py-1">
                      <CheckCircle2 size={16} />
                      <span>Ready for Rider Dispatch</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

