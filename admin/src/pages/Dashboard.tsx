import React, { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  TrendingUp,
  IndianRupee,
  Package,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';
import { useMeals, useOrders, type OrderStats } from '@/hooks';

/* ── Stat Card ── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string; // tailwind bg colour
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 font-display-sans">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Recent Meal Row ── */
function RecentMealRow({ name, price, categories, available }: {
  name: string; price: number; categories: string[]; available: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${available ? 'bg-[#49E619]' : 'bg-red-500'}`} />
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-[11px] text-white/30 mt-0.5">{categories.join(' · ')}</p>
        </div>
      </div>
      <span className="text-sm font-mono-tabular text-[#49E619] font-bold">₹{price}</span>
    </div>
  );
}

/* ── Dashboard Page ── */
export function Dashboard(): React.ReactElement {
  const { meals, loading, error, fetchMeals } = useMeals();
  const { stats: orderStats, fetchStats } = useOrders();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalMeals = meals.length;
  const activeMeals = meals.filter((m) => m.isAvailable && !m.isDeleted).length;
  const unavailableMeals = meals.filter((m) => !m.isAvailable && !m.isDeleted).length;
  const avgPrice = totalMeals > 0
    ? Math.round(meals.reduce((s, m) => s + m.priceInRupees, 0) / totalMeals)
    : 0;
  const totalRevenuePotential = meals.reduce((s, m) => s + m.priceInRupees, 0);
  const vegCount = meals.filter((m) => m.mealCategories.includes('VEG')).length;
  const nonVegCount = meals.filter((m) => m.mealCategories.includes('NON-VEG')).length;

  const greeting = time.getHours() < 12 ? 'Good Morning' : time.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#49E619] font-bold font-mono-tabular">
            Dashboard Overview
          </p>
          <h1 className="text-3xl font-bold text-white mt-1 font-display-sans">
            {greeting}, Admin 👋
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => { fetchMeals(); fetchStats(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#122023] border border-white/10 text-sm text-white/70 hover:text-white hover:border-[#49E619]/40 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchMeals} className="ml-auto underline text-xs cursor-pointer">Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orderStats?.totalOrders || 0}
          sub={`₹${(orderStats?.totalRevenue || 0).toLocaleString('en-IN')} revenue`}
          icon={<ShoppingBag size={18} className="text-[#080808]" />}
          accent="bg-[#4EDBE2]"
        />
        <StatCard
          label="Pending Orders"
          value={orderStats?.pendingOrders || 0}
          sub="awaiting preparation"
          icon={<Clock size={18} className="text-[#080808]" />}
          accent="bg-[#B9FF2C]"
        />
        <StatCard
          label="In Transit"
          value={orderStats?.outForDelivery || 0}
          sub="out for delivery"
          icon={<Truck size={18} className="text-[#080808]" />}
          accent="bg-[#FFB347]"
        />
        <StatCard
          label="Delivered"
          value={orderStats?.deliveredOrders || 0}
          sub={`${orderStats?.totalSponsoredMeals || 0} meals sponsored`}
          icon={<CheckCircle2 size={18} className="text-[#080808]" />}
          accent="bg-[#49E619]"
        />
      </div>

      {/* Meals Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Meals"
          value={totalMeals}
          sub={`${vegCount} Veg · ${nonVegCount} Non-Veg`}
          icon={<UtensilsCrossed size={18} className="text-[#080808]" />}
          accent="bg-[#49E619]"
        />
        <StatCard
          label="Active / Available"
          value={activeMeals}
          sub={`${unavailableMeals} unavailable`}
          icon={<Package size={18} className="text-[#080808]" />}
          accent="bg-[#4EDBE2]"
        />
        <StatCard
          label="Avg Price"
          value={`₹${avgPrice}`}
          sub="per meal"
          icon={<IndianRupee size={18} className="text-[#080808]" />}
          accent="bg-[#B9FF2C]"
        />
        <StatCard
          label="Catalogue Value"
          value={`₹${totalRevenuePotential.toLocaleString('en-IN')}`}
          sub="total listed"
          icon={<TrendingUp size={18} className="text-[#080808]" />}
          accent="bg-[#49E619]"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Meals */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0D1719] border border-white/8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Meals</h2>
            <span className="text-[11px] text-white/30 font-mono-tabular">{meals.length} total</span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-white/30 text-sm">Loading meals…</div>
          ) : meals.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">No meals found. Create one from the Meals page.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {meals.slice(0, 8).map((m) => (
                <RecentMealRow
                  key={m._id}
                  name={m.mealName}
                  price={m.priceInRupees}
                  categories={m.mealCategories}
                  available={m.isAvailable}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* Category Breakdown */}
          <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Category Breakdown</h2>
            {['VEG', 'NON-VEG', 'PROTEIN', 'KIDS MEALS', 'FAMILY MEALS'].map((cat) => {
              const count = meals.filter((m) => m.mealCategories.includes(cat)).length;
              const pct = totalMeals > 0 ? Math.round((count / totalMeals) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-white/50 w-24 shrink-0 font-mono-tabular">{cat}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#49E619] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 font-mono-tabular w-12 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>

          {/* System Info */}
          <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">System</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">API Endpoint</span>
                <span className="text-[#4EDBE2] font-mono-tabular">localhost:5000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Admin UI Port</span>
                <span className="text-white/70 font-mono-tabular">5174</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">API Status</span>
                <span className={`font-bold ${error ? 'text-red-400' : 'text-[#49E619]'}`}>
                  {error ? 'Unreachable' : 'Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
