import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useKitchenOrders, useOrders, type KitchenOrder, type Order } from '@/hooks';

/* ── Stat card for Orders ── */
function OrderStat({ label, value, icon, accent }: {
  label: string; value: number; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-medium">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5 font-display-sans">{value}</p>
      </div>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    confirmed: { color: 'bg-[#B9FF2C] text-[#122023]', label: 'Confirmed' },
    preparing: { color: 'bg-[#4EDBE2] text-[#080808]', label: 'Preparing' },
    out_for_delivery: { color: 'bg-[#FFB347] text-[#080808]', label: 'Out for Delivery' },
    delivered: { color: 'bg-[#49E619] text-[#080808]', label: 'Delivered' },
    cancelled: { color: 'bg-red-500 text-white', label: 'Cancelled' },
  };

  const { color, label } = config[status] || { color: 'bg-white/10 text-white/50', label: status };

  return (
    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

function KitchenOrders(): React.ReactElement {
  const { orders, loading, error, fetchPaidOrders, changeOrderStatus } = useKitchenOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleAction = async (order: KitchenOrder, action: 'startPreparing' | 'markReady') => {
    setUpdatingOrderId(order._id);
    await changeOrderStatus(order._id, action);
    setUpdatingOrderId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#4EDBE2] font-bold font-mono-tabular">
            Kitchen Queue
          </p>
          <h1 className="text-2xl font-bold text-white mt-1 font-display-sans">Paid Orders</h1>
          <p className="text-sm text-white/40 mt-1">Prepare paid orders assigned to your kitchen.</p>
        </div>
        <button
          onClick={fetchPaidOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#122023] border border-white/10 text-sm text-white/70 hover:text-white hover:border-[#49E619]/40 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-white/30 text-sm flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading paid orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-white/30 text-sm">No paid orders in your kitchen queue.</div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const address = order.deliveryAddress;
            const addressText = address
              ? [address.addressLine1, address.addressLine2, address.area, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')
              : 'No delivery address';

            return (
              <article key={order._id} className="rounded-2xl bg-[#0D1719] border border-white/8 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono-tabular text-[#4EDBE2] font-bold">{order.orderNumber}</p>
                    <p className="text-sm font-medium text-white mt-1">{order.customerName}</p>
                    <p className="text-xs text-white/40 mt-1">{addressText}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.customerMealStatus} />
                    <p className="text-sm font-bold text-[#49E619] mt-2">₹{order.totalAmountInr}</p>
                  </div>
                </div>

                <ul className="border-t border-white/8 pt-3 space-y-2">
                  {order.items.map((item, index) => (
                    <li key={`${item.productName}-${index}`} className="flex justify-between gap-4 text-sm">
                      <span className="text-white/75">{item.productName}</span>
                      <span className="text-white/45">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-end border-t border-white/8 pt-3">
                  {order.customerMealStatus === 'confirmed' && (
                    <button
                      onClick={() => handleAction(order, 'startPreparing')}
                      disabled={updatingOrderId === order._id}
                      className="px-4 py-2 rounded-lg bg-[#4EDBE2] text-[#080808] text-xs font-bold hover:brightness-110 disabled:opacity-50"
                    >
                      {updatingOrderId === order._id ? 'Updating…' : 'Start Preparing'}
                    </button>
                  )}
                  {order.customerMealStatus === 'preparing' && (
                    <button
                      onClick={() => handleAction(order, 'markReady')}
                      disabled={updatingOrderId === order._id}
                      className="px-4 py-2 rounded-lg bg-[#B9FF2C] text-[#080808] text-xs font-bold hover:brightness-110 disabled:opacity-50"
                    >
                      {updatingOrderId === order._id ? 'Updating…' : 'Mark Ready'}
                    </button>
                  )}
                  {order.customerMealStatus === 'readyforpickup' && (
                    <span className="text-xs text-white/40">Waiting for rider pickup</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminOrders(): React.ReactElement {
  const { orders, stats, loading, error, fetchOrders, updateStatus, deleteOrder: deleteOrderById } = useOrders();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const statusMap: Record<string, string> = {
      'ALL': '',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'out_for_delivery': 'outfordelivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    };
    const query = filterStatus === 'ALL' ? {} : { status: statusMap[filterStatus] };
    fetchOrders(query);
  }, [filterStatus, fetchOrders]);

  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerEmail.toLowerCase().includes(q);
    const statusMap: Record<string, string> = {
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'out_for_delivery': 'outfordelivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    };
    const backendStatus = statusMap[filterStatus] || filterStatus;
    const matchStatus = filterStatus === 'ALL' || order.orderStatus === backendStatus;
    return matchSearch && matchStatus;
  }) : [];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus(orderId, newStatus);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await deleteOrderById(orderId);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-[#4EDBE2] font-bold font-mono-tabular">
          Order Management
        </p>
        <h1 className="text-2xl font-bold text-white mt-1 font-display-sans">Orders</h1>
        <p className="text-sm text-white/40 mt-1">
          View and manage customer and sponsorship orders.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OrderStat label="Total Orders" value={stats.totalOrders} icon={<ShoppingBag size={16} className="text-[#080808]" />} accent="bg-[#4EDBE2]" />
          <OrderStat label="Pending" value={stats.pendingOrders} icon={<Clock size={16} className="text-[#080808]" />} accent="bg-[#B9FF2C]" />
          <OrderStat label="Delivered" value={stats.deliveredOrders} icon={<CheckCircle2 size={16} className="text-[#080808]" />} accent="bg-[#49E619]" />
          <OrderStat label="In Transit" value={stats.outForDelivery} icon={<Truck size={16} className="text-[#080808]" />} accent="bg-[#4EDBE2]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0D1719] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4EDBE2]/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#4EDBE2] text-[#080808]'
                  : 'bg-[#0D1719] text-white/50 border border-white/8 hover:border-[#4EDBE2] hover:text-white'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#0D1719] border border-white/8 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/30 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            {search || filterStatus !== 'ALL' ? 'No orders match your filters.' : 'No orders yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Order #</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Customer</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Sponsored</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-mono-tabular text-[#4EDBE2] font-bold">{order.orderNumber}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{order.customerName}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono-tabular font-bold text-[#49E619]">
                      ₹{order.total}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-3 font-mono-tabular text-white/50">
                      {order.sponsoredMealsCount}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="px-2 py-1 rounded bg-[#080808] border border-white/20 text-white/70 text-xs focus:outline-none focus:border-[#4EDBE2] cursor-pointer"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {deleteConfirm === order._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(order._id)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-red-500 text-white cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-white/60 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(order._id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function Orders(): React.ReactElement {
  const { admin } = useAuth();
  return admin?.role === 'kitchen' ? <KitchenOrders /> : <AdminOrders />;
}
