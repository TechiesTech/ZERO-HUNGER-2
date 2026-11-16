import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Plus, Search, X } from 'lucide-react';
import { createKitchen as createKitchenAccount, getKitchens, type KitchenListItem } from '../services/adminApi';

interface KitchenForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const EMPTY_FORM: KitchenForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

function formatKitchenAddress(address: KitchenListItem['address']): string {
  if (!address) return '—';
  if (typeof address === 'string') return address;

  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(', ') || '—';
}

export function Kitchens(): React.ReactElement {
  const [kitchens, setKitchens] = useState<KitchenListItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<KitchenForm>(EMPTY_FORM);

  const fetchKitchens = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(nextPage), limit: '10' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('isActive', status);

    try {
      const response = await getKitchens(params);
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
      void fetchKitchens(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [fetchKitchens]);

  const createKitchen = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      await createKitchenAccount(payload);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setSuccess('Kitchen account created. The kitchen partner must add their pickup address and coordinates after signing in.');
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#49E619]">Partner administration</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Kitchens</h1>
          <p className="mt-1 text-sm text-white/45">Create kitchen accounts and review kitchen partners.</p>
        </div>
        <button
          type="button"
          onClick={() => { setError(''); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#49E619] px-4 py-2.5 text-sm font-bold text-black"
        >
          <Plus size={16} /> Add kitchen
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={16} />{error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-xl border border-[#49E619]/30 bg-[#49E619]/10 p-4 text-sm text-[#49E619]">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone"
            className="w-full rounded-xl border border-white/10 bg-[#0D1719] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#49E619]/50"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-white/10 bg-[#0D1719] px-3 py-2.5 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1719]">
        {loading ? (
          <div className="flex justify-center py-16 text-white/50"><Loader2 className="animate-spin" /></div>
        ) : kitchens.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">No kitchens found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-5 py-3">Kitchen</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Address</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {kitchens.map((kitchen) => (
                  <tr key={kitchen._id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{kitchen.name}</p>
                    </td>
                    <td className="px-5 py-4 text-white/65">
                      {kitchen.email}<p className="mt-1 text-xs text-white/40">{kitchen.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-white/60">
                      {formatKitchenAddress(kitchen.address)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={kitchen.isActive ? 'text-[#49E619]' : 'text-red-400'}>
                        {kitchen.isActive ? 'Active' : 'Inactive'}
                      </span>
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
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => void fetchKitchens(page - 1)}
              className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => void fetchKitchens(page + 1)}
              className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1719] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#49E619]">New partner</p>
                <h2 className="mt-1 text-xl font-bold text-white">Create kitchen account</h2>
                <p className="mt-2 text-xs text-white/50">
                  The kitchen partner will add their pickup address and coordinates in the Kitchen Portal after signing in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createKitchen} className="grid gap-4 sm:grid-cols-2">
              {([
                ['name', 'Kitchen name', 'text', true],
                ['email', 'Email', 'email', true],
                ['phone', 'Phone (10 digits)', 'tel', true],
              ] as const).map(([key, label, type, required]) => (
                <label key={key} className="block text-sm text-white/70">
                  {label}
                  <input
                    type={type}
                    required={required}
                    value={form[key]}
                    onChange={(event) => updateForm(key, event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#080808] px-3 py-2.5 text-white outline-none focus:border-[#49E619]/50"
                  />
                </label>
              ))}

              <label className="block text-sm text-white/70 sm:col-span-2">
                Initial password (min 8 chars)
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) => updateForm('password', event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#080808] pl-3 pr-11 py-2.5 text-white outline-none focus:border-[#49E619]/50"
                    placeholder="Temporary password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#49E619] transition-colors rounded-lg cursor-pointer hover:bg-white/5 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <div className="flex gap-3 pt-2 sm:col-span-2">
                <button
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#49E619] py-3 font-bold text-black disabled:opacity-60"
                >
                  {submitting ? 'Creating…' : 'Create kitchen'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-white/10 px-5 text-white/70"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
