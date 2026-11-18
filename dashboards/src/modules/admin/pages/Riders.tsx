import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bike, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { api } from '@/services/adminApi';

interface Rider {
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'rejected';
  vehicleType?: string;
  vehicleNumber?: string;
  totalDeliveries?: number;
  lastLocationAt?: string | null;
  isLive?: boolean;
  isBusy?: boolean;
  currentOrderNumber?: string;
}

interface RiderStats {
  totalRiders: number;
  pending: number;
  active: number;
  live: number;
  busy: number;
  free: number;
}

interface RiderListResponse {
  success: boolean;
  data: {
    riders: Rider[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

const RIDER_FILTERS = [
  { value: '', label: 'All riders' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'active', label: 'Active' },
  { value: 'live', label: 'Online' },
  { value: 'busy', label: 'On delivery' },
  { value: 'free', label: 'Available' },
];

export function Riders(): React.ReactElement {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRiders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (filter) params.set('status', filter);
      const [listResponse, statsResponse] = await Promise.all([
        api.get<RiderListResponse>(`/api/riders/getAllRiders?${params.toString()}`),
        api.get<{ success: boolean; data: RiderStats }>('/api/riders/getRiderStats'),
      ]);
      setRiders(listResponse.data.riders);
      setTotal(listResponse.data.pagination.total);
      setTotalPages(listResponse.data.pagination.totalPages);
      setStats(statsResponse.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load rider information.');
      setRiders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void loadRiders();
  }, [loadRiders]);

  const review = async (rider: Rider, status: 'active' | 'rejected') => {
    const reason = status === 'rejected'
      ? window.prompt('Reason for rejecting this rider (required):')?.trim() || ''
      : '';
    if (status === 'rejected' && reason.length < 3) {
      setError('Enter a rejection reason with at least 3 characters.');
      return;
    }
    setReviewing(rider.userId);
    setError('');
    try {
      await api.patch(`/api/riders/reviewRider/${rider.userId}`, {
        status,
        ...(status === 'rejected' ? { reason } : {}),
      });
      await loadRiders();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not review this rider.');
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#B9FF2C] font-bold font-mono-tabular">Fleet Management</p>
          <h1 className="text-2xl font-bold text-white mt-1 font-display-sans">Delivery Riders</h1>
          <p className="text-sm text-white/40 mt-1">Review applications and monitor rider availability and deliveries.</p>
        </div>
        <button onClick={() => void loadRiders()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0D1719] px-4 py-2.5 text-sm text-white/70 hover:text-white disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['All Riders', stats.totalRiders],
            ['Pending', stats.pending],
            ['Approved', stats.active],
            ['Online', stats.live],
            ['On Delivery', stats.busy],
            ['Available', stats.free],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#0D1719] p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#B9FF2C]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

      <div className="flex flex-wrap gap-2">
        {RIDER_FILTERS.map((item) => (
          <button key={item.value} onClick={() => { setFilter(item.value); setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item.value ? 'bg-[#B9FF2C] text-[#080808]' : 'border border-white/10 bg-[#0D1719] text-white/55 hover:text-white'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0D1719]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/40"><Loader2 size={16} className="animate-spin" /> Loading riders…</div>
        ) : riders.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/40"><Bike size={26} className="mx-auto mb-2 opacity-40" />No riders found for this filter.</div>
        ) : (
          <div className="divide-y divide-white/8">
            {riders.map((rider) => (
              <article key={rider.userId} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-white">{rider.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rider.status === 'pending' ? 'bg-amber-400/15 text-amber-300' : rider.status === 'active' ? 'bg-green-400/15 text-green-300' : 'bg-red-400/15 text-red-300'}`}>{rider.status}</span>
                    {rider.isLive && <span className="rounded-full bg-[#4EDBE2]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#4EDBE2]">Online</span>}
                    {rider.isBusy && <span className="rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-300">On delivery</span>}
                  </div>
                  <p className="mt-1 text-xs text-white/45">{rider.email} · {rider.phone}</p>
                  <p className="mt-2 text-xs text-white/55">
                    {rider.vehicleType || 'Vehicle not set'} {rider.vehicleNumber ? `· ${rider.vehicleNumber}` : ''}
                    {' · '}{rider.totalDeliveries || 0} completed
                    {rider.currentOrderNumber ? ` · Current: ${rider.currentOrderNumber}` : ''}
                  </p>
                  {rider.lastLocationAt && <p className="mt-1 text-[11px] text-white/30">Last location {new Date(rider.lastLocationAt).toLocaleString()}</p>}
                </div>
                {rider.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => void review(rider, 'active')} disabled={reviewing === rider.userId} className="inline-flex items-center gap-1 rounded-lg bg-[#B9FF2C] px-3 py-2 text-xs font-bold text-[#080808] disabled:opacity-50">
                      {reviewing === rider.userId ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                    </button>
                    <button onClick={() => void review(rider, 'rejected')} disabled={reviewing === rider.userId} className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50">
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {!loading && (
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-sm text-white/45">
            <span>{total} riders · Page {page} of {Math.max(totalPages, 1)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30">Previous</button>
              <button onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
