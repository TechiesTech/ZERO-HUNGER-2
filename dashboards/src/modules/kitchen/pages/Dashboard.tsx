import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kitchenApi } from '../services/kitchenApi';
import type { KitchenOrder, KitchenProfile, Meal } from '../types';
import { useAuth } from '@core/auth/useAuth';
import {
  ChefHat,
  Clock,
  CheckCircle,
  PackageCheck,
  UtensilsCrossed,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<KitchenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, profileRes] = await Promise.all([
        kitchenApi.getPaidOrders().catch(() => ({ success: false, data: [] })),
        kitchenApi.getProfile().catch(() => ({ success: false, data: null })),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      // Fetch kitchen meals if user has id
      if (user?._id) {
        const mealsRes = await kitchenApi.getMeals(user._id).catch(() => ({ success: false, data: [] }));
        if (Array.isArray(mealsRes.data)) {
          setMeals(mealsRes.data);
        } else if (mealsRes.data && 'meals' in mealsRes.data && Array.isArray(mealsRes.data.meals)) {
          setMeals(mealsRes.data.meals);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?._id]);

  const handleStartPreparing = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await kitchenApi.startPreparing(orderId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await kitchenApi.markReady(orderId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const getOrderStatus = (o: KitchenOrder) => o.status || o.customerMealStatus || 'confirmed';

  const confirmedOrders = orders.filter((o) => getOrderStatus(o) === 'confirmed');
  const preparingOrders = orders.filter((o) => getOrderStatus(o) === 'preparing');
  const readyOrders = orders.filter((o) => getOrderStatus(o) === 'readyforpickup');

  const formatAddress = (addr: KitchenOrder['deliveryAddress']): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    return [addr.addressLine1, addr.addressLine2, addr.area, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(', ');
  };

  const hasLocation = Boolean(profile?.location?.latitude && profile?.location?.longitude);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Kitchen Overview</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#49E619]/10 text-[#49E619] border border-[#49E619]/20">
              Live Operations
            </span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Welcome back, {user?.name || 'Kitchen Partner'}. Manage your meals and orders in real time.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* GPS Warning if not set */}
      {!hasLocation && !loading && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="text-sm font-semibold">GPS Location Missing</p>
              <p className="text-xs text-amber-400/80">
                Set your kitchen GPS coordinates so customer dispatch and delivery routes calculate correctly.
              </p>
            </div>
          </div>
          <Link
            to="/kitchen/profile"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Update Location
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">New Orders</p>
            <p className="text-3xl font-extrabold text-white mt-2 font-mono-tabular">
              {confirmedOrders.length}
            </p>
            <p className="text-xs text-amber-400/80 mt-1">Needs Preparation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Cooking Now</p>
            <p className="text-3xl font-extrabold text-[#4EDBE2] mt-2 font-mono-tabular">
              {preparingOrders.length}
            </p>
            <p className="text-xs text-[#4EDBE2]/80 mt-1">In Preparation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#4EDBE2]/10 border border-[#4EDBE2]/20 flex items-center justify-center text-[#4EDBE2]">
            <ChefHat size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Ready for Pickup</p>
            <p className="text-3xl font-extrabold text-[#49E619] mt-2 font-mono-tabular">
              {readyOrders.length}
            </p>
            <p className="text-xs text-[#49E619]/80 mt-1">Awaiting Rider</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#49E619]/10 border border-[#49E619]/20 flex items-center justify-center text-[#49E619]">
            <PackageCheck size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Active Meals</p>
            <p className="text-3xl font-extrabold text-white mt-2 font-mono-tabular">
              {meals.filter((m) => m.isAvailable).length}
            </p>
            <p className="text-xs text-white/40 mt-1">{meals.length} total dishes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
            <UtensilsCrossed size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Incoming Orders & Kitchen Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Order Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Active Orders Queue</span>
              <span className="text-xs text-white/40 font-normal">
                ({orders.filter((o) => getOrderStatus(o) !== 'readyforpickup').length} pending)
              </span>
            </h2>
            <Link
              to="/kitchen/orders"
              className="text-xs text-[#49E619] hover:underline inline-flex items-center gap-1 font-medium"
            >
              View all orders <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-[#0D1719] rounded-2xl border border-white/8 text-white/40 text-sm">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center bg-[#0D1719] rounded-2xl border border-white/8">
              <CheckCircle size={32} className="mx-auto text-[#49E619]/50 mb-3" />
              <p className="text-white font-medium text-sm">No active orders right now</p>
              <p className="text-white/40 text-xs mt-1">Paid customer orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const status = getOrderStatus(order);
                const isConfirmed = status === 'confirmed';
                const isPreparing = status === 'preparing';

                return (
                  <div
                    key={order._id}
                    className="p-4 rounded-xl bg-[#0D1719] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/15 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular font-bold text-white text-sm">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : isPreparing
                              ? 'bg-[#4EDBE2]/10 text-[#4EDBE2] border border-[#4EDBE2]/20'
                              : 'bg-[#49E619]/10 text-[#49E619] border border-[#49E619]/20'
                          }`}
                        >
                          {status}
                        </span>
                        <span className="text-xs text-white/40 font-mono-tabular">
                          ₹{order.totalAmount ?? order.totalAmountInr ?? 0}
                        </span>
                      </div>

                      <div className="text-xs text-white/80">
                        {order.items?.map((it, idx) => (
                          <span key={idx} className="mr-3">
                            {it.quantity}x {it.mealName || it.productName || 'Meal'}
                          </span>
                        ))}
                      </div>

                      {order.deliveryAddress && (
                        <p className="text-[11px] text-white/40 flex items-center gap-1">
                          <MapPin size={11} /> {formatAddress(order.deliveryAddress)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isConfirmed && (
                        <button
                          onClick={() => handleStartPreparing(order._id)}
                          disabled={actionLoading === order._id}
                          className="px-3.5 py-1.5 rounded-lg bg-[#4EDBE2] text-black font-semibold text-xs hover:bg-[#3ec4cb] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading === order._id ? 'Updating...' : 'Start Cooking'}
                        </button>
                      )}
                      {isPreparing && (
                        <button
                          onClick={() => handleMarkReady(order._id)}
                          disabled={actionLoading === order._id}
                          className="px-3.5 py-1.5 rounded-lg bg-[#49E619] text-black font-semibold text-xs hover:bg-[#3dd111] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading === order._id ? 'Updating...' : 'Mark Ready'}
                        </button>
                      )}
                      {status === 'readyforpickup' && (
                        <span className="text-xs text-[#49E619] font-medium flex items-center gap-1">
                          <CheckCircle size={14} /> Ready for rider
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Kitchen Profile & Quick Links */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Kitchen Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-white/40 uppercase text-[10px]">Name</p>
                <p className="text-white font-medium mt-0.5">{profile?.name || user?.name || 'Kitchen Partner'}</p>
              </div>

              <div>
                <p className="text-white/40 uppercase text-[10px]">Email & Contact</p>
                <p className="text-white font-medium mt-0.5">{profile?.email || user?.email}</p>
                {profile?.phone && <p className="text-white/60">{profile.phone}</p>}
              </div>

              <div>
                <p className="text-white/40 uppercase text-[10px]">Address</p>
                <p className="text-white/80 mt-0.5 leading-relaxed">
                  {profile?.address || 'No address set yet'}
                </p>
              </div>

              <div>
                <p className="text-white/40 uppercase text-[10px]">Coordinates</p>
                <p className="font-mono-tabular text-white/80 mt-0.5">
                  {profile?.location?.latitude && profile?.location?.longitude
                    ? `${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`
                    : 'Not configured'}
                </p>
              </div>
            </div>

            <Link
              to="/kitchen/profile"
              className="w-full mt-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
            >
              <span>Edit Profile & Location</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1719] border border-white/8 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/kitchen/meals"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
              >
                <UtensilsCrossed size={18} className="text-[#49E619]" />
                <span className="font-medium">Manage Menu</span>
              </Link>
              <Link
                to="/kitchen/orders"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
              >
                <PackageCheck size={18} className="text-[#4EDBE2]" />
                <span className="font-medium">All Orders</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

