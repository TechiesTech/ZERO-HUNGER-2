import React from 'react';
import { Power, Menu, UserCheck, ShieldAlert } from 'lucide-react';

interface HeaderBarProps {
  riderName: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  onMenuClick?: () => void;
  isLoading?: boolean;
  hasActiveDelivery?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  riderName,
  isOnline,
  onToggleOnline,
  onMenuClick,
  isLoading,
  hasActiveDelivery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 pt-safe pb-3">
      <div className="flex items-center justify-between gap-3">
        {/* Menu icon + Rider profile status */}
        <div className="flex items-center gap-2 min-w-0 ml-[-16px]">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate leading-tight">{riderName}</h1>
            <p className="text-xs text-zinc-400 font-medium leading-tight">
              {isOnline ? (hasActiveDelivery ? 'On Delivery' : 'Online & Waiting') : 'Offline'}
            </p>
          </div>
        </div>

        {/* Online/Offline Toggle Button */}
        <button
          onClick={onToggleOnline}
          disabled={isLoading || hasActiveDelivery}
          className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
            isOnline
              ? 'bg-[#49E619] hover:bg-[#3ED016] text-zinc-950 shadow-[#49E619]/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          } ${hasActiveDelivery ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <Power className="w-3.5 h-3.5 shrink-0" />
          <span>{isOnline ? 'OFFLINE' : 'ONLINE'}</span>
        </button>
      </div>
    </header>
  );
};

