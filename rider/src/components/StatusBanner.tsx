import React from 'react';
import { AlertTriangle, WifiOff, MapPinOff, Clock } from 'lucide-react';

interface StatusBannerProps {
  type: 'warning' | 'error' | 'info';
  message: string;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ type, message, onDismiss }) => {
  const styles = {
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    error: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    info: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  }[type];

  const Icon = {
    warning: AlertTriangle,
    error: WifiOff,
    info: Clock,
  }[type];

  return (
    <div className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${styles}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs underline font-semibold shrink-0">
          Dismiss
        </button>
      )}
    </div>
  );
};

