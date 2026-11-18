import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getRiderStats,
  getRiders,
  reviewRider,
  type RiderListFilter,
  type RiderListItem,
  type RiderStats,
} from '../services/adminApi';

const EMPTY_STATS: RiderStats = {
  totalRiders: 0,
  pending: 0,
  active: 0,
  live: 0,
  busy: 0,
  free: 0,
};

const FILTERS: { value: '' | RiderListFilter; label: string }[] = [
  { value: '', label: 'All riders' },
  { value: 'pending', label: 'Pending review' },
  { value: 'active', label: 'Active' },
  { value: 'live', label: 'Live' },
  { value: 'busy', label: 'Busy' },
  { value: 'free', label: 'Free' },
];

export function Riders(): React.ReactElement {
  const [riders, setRiders] = useState<RiderListItem[]>([]);
  const [stats, setStats] = useState<RiderStats>(EMPTY_STATS);
  const [filter, setFilter] = useState<'' | RiderListFilter>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingRider, setUpdatingRider] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectingRider, setRejectingRider] = useState<RiderListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRiders = useCallback(async (nextPage: number, nextFilter: '' | RiderListFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
      if (nextFilter) params.set('status', nextFilter);
      const [riderResponse, statsResponse] = await Promise.all([
        getRiders(params),
        getRiderStats(),
      ]);
      setRiders(riderResponse.data.riders);
      setPage(riderResponse.data.pagination.page);
      setTotal(riderResponse.data.pagination.total);
      setTotalPages(riderResponse.data.pagination.totalPages);
      setStats(statsResponse.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRiders(page, filter);
  }, [filter, loadRiders, page]);

  const approveRider = async (rider: RiderListItem) => {
    setUpdatingRider(rider.userId);
    setError('');
    setSuccess('');
    try {
      await reviewRider(rider.userId, { status: 'active' });
      setSuccess(`${rider.name} was approved.`);
      await loadRiders(page, filter);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to approve rider');
    } finally {
      setUpdatingRider(null);
    }
  };

  const rejectRider = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejectingRider || rejectionReason.trim().length < 3) return;

    setUpdatingRider(rejectingRider.userId);
    setError('');
    setSuccess('');
    try {
      await reviewRider(rejectingRider.userId, {
        status: 'rejected',
        reason: rejectionReason.trim(),
      });
      setSuccess(`${rejectingRider.name}'s application was rejected.`);
      setRejectingRider(null);
      setRejectionReason('');
      await loadRiders(page, filter);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to reject rider');
    } finally {
      setUpdatingRider(null);
    }
  };

  const statCards = [
    { label: 'Total Riders', value: stats.totalRiders, color: 'text-white' },
    { label: 'Pending Review', value: stats.pending, color: 'text-amber-300' },
    { label: 'Active', value: stats.active, color: 'text-[#B9FF2C]' },
    { label: 'Live Now', value: stats.live, color: 'text-[#4EDBE2]' },
    { label: 'Busy / Free', value: `${stats.busy} / ${stats.free}`, color: 'text-white' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#B9FF2C]">Fleet management</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Delivery Riders</h1>
          <p className="mt-1 text-sm text-white/45">Review rider applications and monitor fleet availability.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadRiders(page, filter)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:border-[#B9FF2C]/40 hover:text-[#B9FF2C] disabled:opacity-40"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={16} />{error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-xl border border-[#B9FF2C]/30 bg-[#B9FF2C]/10 p-4 text-sm text-[#B9FF2C]">
          {success}
        </div>
      )}

      <section aria-label="Rider statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-[#0D1719] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs uppercase tracking-wide text-white/45">
          Filter riders
          <select
            value={filter}
            onChange={(event) => {
              setPage(1);
              setFilter(event.target.value as '' | RiderListFilter);
              setSuccess('');
            }}
            className="ml-3 rounded-xl border border-white/10 bg-[#0D1719] px-3 py-2.5 text-sm normal-case text-white"
          >
            {FILTERS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <span className="text-sm text-white/45">{total} rider{total === 1 ? '' : 's'}</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1719]">
        {loading ? (
          <div className="flex justify-center py-16 text-white/50"><Loader2 className="animate-spin" /></div>
        ) : riders.length === 0 ? (
          <div className="py-16 text-center">
            <Bike size={28} className="mx-auto mb-3 text-white/25" />
            <p className="text-sm text-white/45">No riders found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-5 py-3">Rider</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Deliveries</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.userId} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{rider.name}</p>
                      <p className="mt-1 text-xs capitalize text-white/40">{rider.status}</p>
                    </td>
                    <td className="px-5 py-4 text-white/65">
                      {rider.email}<p className="mt-1 text-xs text-white/40">{rider.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-white/65">
                      <span className="capitalize">{rider.vehicleType}</span>
                      <p className="mt-1 text-xs uppercase text-white/40">{rider.vehicleNumber}</p>
                    </td>
                    <td className="px-5 py-4 text-white/65">{rider.totalDeliveries}</td>
                    <td className="px-5 py-4">
                      {rider.status === 'pending' ? (
                        <span className="text-amber-300">Pending review</span>
                      ) : (
                        <>
                          <span className={rider.isLive ? 'text-[#4EDBE2]' : 'text-white/50'}>
                            {rider.isLive ? (rider.isBusy ? 'Live · Busy' : 'Live · Free') : 'Offline'}
                          </span>
                          {rider.currentOrderNumber && (
                            <p className="mt-1 text-xs text-white/40">Order {rider.currentOrderNumber}</p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {rider.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void approveRider(rider)}
                            disabled={updatingRider === rider.userId}
                            aria-label={`Approve ${rider.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B9FF2C]/25 px-3 py-2 text-xs font-semibold text-[#B9FF2C] hover:bg-[#B9FF2C]/10 disabled:opacity-40"
                          >
                            {updatingRider === rider.userId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingRider(rider); setRejectionReason(''); }}
                            disabled={updatingRider === rider.userId}
                            aria-label={`Reject ${rider.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-40"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/55">
          <span>Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {rejectingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={rejectRider} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D1719] p-6">
            <h2 className="text-xl font-bold text-white">Reject rider application</h2>
            <p className="mt-1 text-sm text-white/50">{rejectingRider.name}</p>
            <label className="mt-5 block text-sm text-white/70">
              Reason
              <textarea
                autoFocus
                required
                minLength={3}
                maxLength={200}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-[#080808] px-3 py-2.5 text-white outline-none focus:border-[#B9FF2C]/50"
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingRider(null)}
                disabled={updatingRider === rejectingRider.userId}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingRider === rejectingRider.userId || rejectionReason.trim().length < 3}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {updatingRider === rejectingRider.userId ? 'Rejecting…' : 'Reject application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}