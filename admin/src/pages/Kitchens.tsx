import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Phone, Mail, X, Check, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/adminApi';

interface Kitchen {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  createdAt: string;
}

interface CreateKitchenForm {
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
