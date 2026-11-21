import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Calendar, TrendingUp } from 'lucide-react';
import { riderService } from '../services/riderService';
import type { RiderUser } from '../types/rider';

interface SummaryPageProps {
  user: RiderUser | null;
  onBack: () => void;
}

interface SummaryData {
  today: { date: string; deliveries: number };
  month: {
    month: string;
    totalDeliveries: number;
    daysWorked: number;
    days: Array<{ date: string; deliveries: number }>;
  };
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ user, onBack }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await riderService.getMySummary(selectedMonth);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month + (direction === 'next' ? 1 : -1);
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const getDeliveryIntensity = (count: number) => {
    if (count === 0) return 'bg-zinc-800 text-zinc-500';
    if (count <= 2) return 'bg-[#49E619]/20 text-[#49E619]';
    if (count <= 5) return 'bg-[#49E619]/40 text-[#49E619]';
    return 'bg-[#49E619] text-zinc-950';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 pt-safe pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white">Delivery Summary</h1>
              <p className="text-xs text-zinc-400">Your performance overview</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Today's Stats */}
        {summary && (
          <div className="bg-gradient-to-br from-[#49E619]/20 to-[#49E619]/5 border border-[#49E619]/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Deliveries</p>
                <p className="text-3xl font-black text-[#49E619] mt-1">{summary.today.deliveries}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#49E619]/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#49E619]" />
              </div>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h2 className="text-sm font-bold text-white">{getMonthName(selectedMonth)}</h2>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              disabled={selectedMonth === new Date().toISOString().slice(0, 7)}
              className="h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Stats */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-950 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{summary.month.totalDeliveries}</p>
                <p className="text-xs text-zinc-400">Total Deliveries</p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{summary.month.daysWorked}</p>
                <p className="text-xs text-zinc-400">Days Worked</p>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#49E619] rounded-full animate-spin" />
            </div>
          ) : summary ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-bold text-zinc-500 py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {summary.month.days.map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all ${
                    isToday(day.date)
                      ? 'bg-[#49E619] text-zinc-950 ring-2 ring-[#49E619]/50'
                      : getDeliveryIntensity(day.deliveries)
                  }`}
                >
                  <span>{getDayNumber(day.date)}</span>
                  {day.deliveries > 0 && (
                    <span className="text-[10px] font-semibold">{day.deliveries}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Legend */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Delivery Intensity</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-800" />
              <span className="text-xs text-zinc-400">No deliveries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#49E619]/20" />
              <span className="text-xs text-zinc-400">1-2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#49E619]/40" />
              <span className="text-xs text-zinc-400">3-5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#49E619]" />
              <span className="text-xs text-zinc-400">6+</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {summary && summary.month.totalDeliveries > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#49E619]" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Performance</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Avg deliveries/day</span>
                <span className="text-sm font-bold text-white">
                  {(summary.month.totalDeliveries / summary.month.daysWorked).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Best day</span>
                <span className="text-sm font-bold text-[#49E619]">
                  {Math.max(...summary.month.days.map(d => d.deliveries))} deliveries
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!loading && !summary && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-400">No delivery data available</p>
            <p className="text-xs text-zinc-500 mt-1">Complete some deliveries to see your summary</p>
          </div>
        )}
      </div>
    </div>
  );
};
