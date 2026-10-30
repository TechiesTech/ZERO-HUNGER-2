import React from 'react';
import { ShoppingBag, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';

/* ── Placeholder stat card for Orders ── */
function OrderStat({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent: string;
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

export function Orders(): React.ReactElement {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OrderStat label="Total Orders" value="—" icon={<ShoppingBag size={16} className="text-[#080808]" />} accent="bg-[#4EDBE2]" />
        <OrderStat label="Pending" value="—" icon={<Clock size={16} className="text-[#080808]" />} accent="bg-[#B9FF2C]" />
        <OrderStat label="Delivered" value="—" icon={<CheckCircle2 size={16} className="text-[#080808]" />} accent="bg-[#49E619]" />
        <OrderStat label="In Transit" value="—" icon={<Truck size={16} className="text-[#080808]" />} accent="bg-[#4EDBE2]" />
      </div>

      {/* Empty State */}
      <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#122023] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={28} className="text-[#4EDBE2]/40" />
        </div>
        <h3 className="text-lg font-bold text-white">Orders Coming Soon</h3>
        <p className="text-sm text-white/30 mt-2 max-w-md mx-auto leading-relaxed">
          The order management system will connect to the backend's order API once the{' '}
          <code className="px-1.5 py-0.5 rounded bg-white/5 text-[#4EDBE2] text-xs font-mono-tabular">
            /api/orders
          </code>{' '}
          endpoints are implemented. You'll be able to view orders, filter by status, assign riders, and track deliveries.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/20">
          <AlertCircle size={12} />
          Backend routes pending implementation
        </div>
      </div>
    </div>
  );
}
