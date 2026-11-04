import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import { api } from '@/services/adminApi';

interface Kitchen {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  location?: { latitude: number; longitude: number };
  isActive: boolean;
  createdAt: string;
}

interface KitchenForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  password: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function Kitchens(): React.ReactElement {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [formData, setFormData] = useState<CreateKitchenForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    password: '',
  });

  const fetchKitchens = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (isActiveFilter !== undefined) params.append('isActive', isActiveFilter.toString());

      const response = await api.get<{ success: boolean; data: { kitchens: Kitchen[]; pagination: Pagination } }>(
        `/api/kitchen/getAllKitchens?${params.toString()}`
      );
      setKitchens(response.data.kitchens);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kitchens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchens(1);
  }, [search, isActiveFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.post('/api/kitchen/createKitchen', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
        password: formData.password,
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        latitude: '',
        longitude: '',
        password: '',
      });
      fetchKitchens(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create kitchen');
    } finally {
      setCreating(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchKitchens(newPage);
    }
interface KitchenListResponse {
  success: boolean;
  data: {
    kitchens: Kitchen[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

const EMPTY_FORM: KitchenForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  latitude: '',
  longitude: '',
  password: '',
};

export function Kitchens(): React.ReactElement {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<KitchenForm>(EMPTY_FORM);

  const fetchKitchens = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('isActive', status);
    try {
      const response = await api.get<KitchenListResponse>(`/api/kitchen/getAllKitchens?${params}`);
      setKitchens(response.data.kitchens);
      setPage(response.data.pagination.page);
      setLimit(response.data.pagination.limit);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load kitchens');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchKitchens(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [fetchKitchens]);

  const createKitchen = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (Boolean(form.latitude) !== Boolean(form.longitude)) {
      setError('Enter both latitude and longitude, or leave both blank.');
      return;
    }
    if (form.latitude && form.longitude) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        setError('Latitude must be between -90 and 90.');
        return;
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setError('Longitude must be between -180 and 180.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
        ...(form.latitude && form.longitude
          ? { location: { latitude: Number(form.latitude), longitude: Number(form.longitude) } }
          : {}),
      };
      await api.post('/api/kitchen/createKitchen', payload);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await fetchKitchens(1);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create kitchen');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (key: keyof KitchenForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#49E619] font-bold font-mono-tabular">
            Kitchen Management
          </p>
          <h1 className="text-3xl font-bold text-white mt-1 font-display-sans">Kitchens</h1>
          <p className="text-sm text-white/40 mt-1">Manage kitchen partners and their credentials</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#49E619] text-black font-semibold text-sm hover:bg-[#49E619]/90 transition-colors"
        >
          <Plus size={16} />
          Add Kitchen
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => fetchKitchens(pagination.page)} className="ml-auto underline text-xs cursor-pointer">Retry</button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D1719] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
          />
        </div>
        <select
          value={isActiveFilter === undefined ? '' : isActiveFilter.toString()}
          onChange={(e) => setIsActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="px-4 py-2.5 bg-[#0D1719] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
        >
          <option value="">All Status</option>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#49E619]">Partner administration</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Kitchens</h1>
          <p className="mt-1 text-sm text-white/45">Create kitchen accounts and review kitchen partners.</p>
        </div>
        <button onClick={() => { setError(''); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#49E619] px-4 py-2.5 text-sm font-bold text-black">
          <Plus size={16} /> Add kitchen
        </button>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle size={16} />{error}</div>}

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone" className="w-full rounded-xl border border-white/10 bg-[#0D1719] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#49E619]/50" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#0D1719] px-3 py-2.5 text-sm text-white">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Kitchens Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-white/40" />
        </div>
      ) : kitchens.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1719] border border-white/8 p-12 text-center">
          <p className="text-white/40 text-sm">No kitchens found. Add your first kitchen partner.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchens.map((kitchen) => (
              <div
                key={kitchen._id}
                className="rounded-2xl bg-[#0D1719] border border-white/8 p-5 hover:border-[#49E619]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">{kitchen.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-2 h-2 rounded-full ${kitchen.isActive ? 'bg-[#49E619]' : 'bg-red-500'}`} />
                      <span className="text-xs text-white/40">{kitchen.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={14} />
                    <span className="truncate">{kitchen.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} />
                    <span>{kitchen.phone}</span>
                  </div>
                  {kitchen.address && (
                    <div className="flex items-start gap-2 text-white/60">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="text-xs line-clamp-2">{kitchen.address}</span>
                    </div>
                  )}
                  {kitchen.location && (
                    <div className="text-xs text-white/30 font-mono-tabular">
                      {kitchen.location.latitude.toFixed(4)}, {kitchen.location.longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/30">
                  Added {new Date(kitchen.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} kitchens
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg bg-[#0D1719] border border-white/10 text-white/60 hover:text-white hover:border-[#49E619]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-white/60">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg bg-[#0D1719] border border-white/10 text-white/60 hover:text-white hover:border-[#49E619]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1719] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New Kitchen</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Kitchen Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="e.g., Central Kitchen"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="kitchen@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors resize-none"
                  placeholder="Kitchen address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                    placeholder="17.3850"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                    placeholder="78.4867"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080808] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#49E619] text-black text-sm font-semibold hover:bg-[#49E619]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Kitchen'}
                </button>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1719]">
        {loading ? (
          <div className="flex justify-center py-16 text-white/50"><Loader2 className="animate-spin" /></div>
        ) : kitchens.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">No kitchens found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                <tr><th className="px-5 py-3">Kitchen</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Address</th><th className="px-5 py-3">Status</th></tr>
              </thead>
              <tbody>
                {kitchens.map((kitchen) => (
                  <tr key={kitchen._id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4"><p className="font-semibold text-white">{kitchen.name}</p><p className="mt-1 font-mono text-xs text-white/35">{kitchen._id}</p></td>
                    <td className="px-5 py-4 text-white/65">{kitchen.email}<p className="mt-1 text-xs text-white/40">{kitchen.phone}</p></td>
                    <td className="px-5 py-4 text-white/60">{kitchen.address || '—'}{kitchen.location && <p className="mt-1 text-xs text-white/35">{kitchen.location.latitude}, {kitchen.location.longitude}</p>}</td>
                    <td className="px-5 py-4"><span className={kitchen.isActive ? 'text-[#49E619]' : 'text-red-400'}>{kitchen.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/55">
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex items-center gap-3">
            <button disabled={page <= 1 || loading} onClick={() => fetchKitchens(page - 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages || loading} onClick={() => fetchKitchens(page + 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1719] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-widest text-[#49E619]">New partner</p><h2 className="mt-1 text-xl font-bold text-white">Create kitchen account</h2></div>
              <button onClick={() => setModalOpen(false)} aria-label="Close dialog" className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={createKitchen} className="grid gap-4 sm:grid-cols-2">
              {([
                ['name', 'Kitchen name', 'text', true],
                ['email', 'Email', 'email', true],
                ['phone', 'Phone (10 digits)', 'tel', true],
                ['address', 'Address', 'text', false],
                ['latitude', 'Latitude (optional)', 'number', false],
                ['longitude', 'Longitude (optional)', 'number', false],
                ['password', 'Initial password (min 8 chars)', 'password', true],
              ] as const).map(([key, label, type, required]) => (
                <label key={key} className={`block text-sm text-white/70 ${key === 'address' || key === 'password' ? 'sm:col-span-2' : ''}`}>
                  {label}
                  <input type={type} required={required} minLength={key === 'password' ? 8 : undefined} step={type === 'number' ? 'any' : undefined} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#080808] px-3 py-2.5 text-white outline-none focus:border-[#49E619]/50" />
                </label>
              ))}
              <div className="flex gap-3 pt-2 sm:col-span-2">
                <button disabled={submitting} className="flex-1 rounded-lg bg-[#49E619] py-3 font-bold text-black disabled:opacity-60">{submitting ? 'Creating…' : 'Create kitchen'}</button>
                <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="rounded-lg border border-white/10 px-5 text-white/70">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
