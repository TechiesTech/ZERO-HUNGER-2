import { useEffect, useState } from 'react';
import { kitchenApi } from '../services/kitchenApi';
import type { KitchenOrder } from '../types';
import { formatDeliveryAddress } from '../components/formatDeliveryAddress';
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

const ORDER_STATUS_UI: Record<
  KitchenOrder['customerMealStatus'],
  { label: string; className: string }
> = {
  confirmed: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  },
  preparing: {
    label: 'Preparing',
    className: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  },
  readyforpickup: {
    label: 'Ready for Pickup',
    className: 'bg-[#49E619]/10 text-[#49E619] border-[#49E619]/25',
  },
  outfordelivery: {
    label: 'Out for Delivery',
    className: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-300 border-red-500/25',
  },
};

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

  const getOrderStatus = (o: KitchenOrder) => o.customerMealStatus;

  const filteredOrders = orders.filter((o) => {
    const status = getOrderStatus(o);
    if (activeTab === 'CONFIRMED' && status !== 'confirmed') return false;
    if (activeTab === 'PREPARING' && status !== 'preparing') return false;
    if (activeTab === 'READY' && status !== 'readyforpickup') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o.orderNumber.toLowerCase().includes(q) || o._id.toLowerCase().includes(q);
      const matchItems = o.items?.some((i) =>
        i.productName.toLowerCase().includes(q)
      );
      return matchId || matchItems;
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
                ? 'bg-[#49E619] text-black shadow-sm'
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
            placeholder="Search order number or items..."
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
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = getOrderStatus(order);
            const isConfirmed = status === 'confirmed';
            const isPreparing = status === 'preparing';
            const isReady = status === 'readyforpickup';
            const statusUi = ORDER_STATUS_UI[status];
            const deliveryAddress = formatDeliveryAddress(order.deliveryAddress);

            return (
              <div
                key={order._id}
                className="rounded-xl bg-[#0D1719] border border-white/8 hover:border-white/15 transition-colors shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 border-b border-white/6">
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <span className="font-mono-tabular font-bold text-white text-sm sm:text-base">
                      Order #{order.orderNumber}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${statusUi.className}`}>
                      {statusUi.label}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-xs text-white/55">
                    {order.createdAt && (
                      <span className="flex items-center gap-1.5 font-mono-tabular">
                        <Calendar size={13} className="text-white/40" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span className="font-bold text-white text-sm font-mono-tabular">
                      ₹{order.totalAmountInr}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)]">
                  <section className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                        Order items
                      </h3>
                      {order.items?.length ? (
                        <span className="text-[10px] text-white/35">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      ) : null}
                    </div>
                    {order.items?.length ? (
                      <ul className="divide-y divide-white/5">
                        {order.items.map((it, idx) => (
                          <li
                            key={`${it.productName}-${idx}`}
                            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-white">{it.productName}</p>
                              <p className="mt-0.5 text-[11px] text-white/45">
                                {it.quantity} × ₹{it.unitPriceInr}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-medium font-mono-tabular text-white/75">
                              ₹{it.totalPriceInr}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-white/40">No items found</p>
                    )}
                  </section>

                  <section className="min-w-0 md:border-l md:border-white/6 md:pl-4">
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                      Delivery
                    </h3>
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-[#49E619]" />
                      <p className="text-xs leading-relaxed text-white/75">
                        {deliveryAddress || 'Address details unavailable'}
                      </p>
                    </div>
                    <p className={`mt-2 pl-[25px] text-[11px] ${
                      isReady ? 'text-[#49E619]' : 'text-white/40'
                    }`}>
                      {isReady ? 'Ready for rider dispatch' : statusUi.label}
                    </p>
                  </section>
                </div>

                {(isConfirmed || isPreparing) && (
                  <div className="flex items-center justify-end gap-3 border-t border-white/6 px-4 py-3">
                    {isConfirmed && (
                      <button
                        onClick={() => handleStartPreparing(order._id)}
                        disabled={actionLoading === order._id}
                        className="rounded-lg bg-[#49E619] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#3dd111] disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === order._id ? 'Updating...' : 'Start Preparing'}
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        onClick={() => handleMarkReady(order._id)}
                        disabled={actionLoading === order._id}
                        className="rounded-lg bg-[#49E619] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-[#3dd111] disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === order._id ? 'Updating...' : 'Mark Ready for Pickup'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

