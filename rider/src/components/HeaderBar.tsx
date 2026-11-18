import React from 'react';
import { Power, Navigation, UserCheck, ShieldAlert } from 'lucide-react';

interface HeaderBarProps {
  riderName: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  isLoading?: boolean;
  hasActiveDelivery?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  riderName,
  isOnline,
  onToggleOnline,
  isLoading,
  hasActiveDelivery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 pt-safe pb-3">
      <div className="flex items-center justify-between gap-3">
        {/* Rider profile status */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-500'
            }`}
          />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-tight">{riderName}</h1>
            <p className="text-xs text-zinc-400 font-medium leading-tight">
              {isOnline ? (hasActiveDelivery ? 'On Delivery' : 'Online & Waiting') : 'Offline'}
            </p>
          </div>
        </div>

        {/* Big Online/Offline Toggle Button (Min 48px touch target) */}
        <button
          onClick={onToggleOnline}
          disabled={isLoading || hasActiveDelivery}
          className={`h-12 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md ${
            isOnline
              ? 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-emerald-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          } ${hasActiveDelivery ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <Power className="w-5 h-5 shrink-0" />
          <span>{isLoading ? 'Updating...' : isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</span>
        </button>
      </div>
    </header>
  );
};

