import React from 'react';
import { Bike, AlertCircle } from 'lucide-react';

export function Riders(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-[#B9FF2C] font-bold font-mono-tabular">
          Fleet Management
        </p>
        <h1 className="text-2xl font-bold text-white mt-1 font-display-sans">Delivery Riders</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage delivery riders, their zones and availability.
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#122023] flex items-center justify-center mx-auto mb-4">
          <Bike size={28} className="text-[#B9FF2C]/40" />
        </div>
        <h3 className="text-lg font-bold text-white">Rider Management Coming Soon</h3>
        <p className="text-sm text-white/30 mt-2 max-w-md mx-auto leading-relaxed">
          The rider management system will connect to the backend&apos;s rider API once the{' '}
          <code className="px-1.5 py-0.5 rounded bg-white/5 text-[#B9FF2C] text-xs font-mono-tabular">
            /api/riders
          </code>{' '}
          endpoints are implemented. You&apos;ll be able to onboard riders, assign delivery zones, and track live availability.
        </p>

        {/* Preview of what's coming */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { label: 'Active Riders', val: '—', color: 'text-[#49E619]' },
            { label: 'Zones Covered', val: '—', color: 'text-[#4EDBE2]' },
            { label: "Today's Deliveries", val: '—', color: 'text-[#B9FF2C]' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-[#080808] border border-white/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/30">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color} mt-1 font-display-sans`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/20">
          <AlertCircle size={12} />
          Backend routes pending implementation
        </div>
      </div>
    </div>
  );
}