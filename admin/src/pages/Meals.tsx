import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useMeals } from '@/hooks';
import type { Meal, MealFormData } from '@/types';
import { MEAL_CATEGORIES } from '@/types';

/* ──────────────────────────────────────────────────────────────
   Blank form data factory
   ────────────────────────────────────────────────────────────── */
function blankForm(): MealFormData {
  return {
    mealName: '',
    mealSlug: '',
    description: '',
    ingredientsList: [],
    mealCategories: [],
    priceInRupees: 0,
    caloriesKcal: 0,
    proteinInGrams: 0,
    imageUrl: '',
    imagePublicId: '',
    isAvailable: true,
    unavailableReason: '',
    displayOrder: 0,
  };
}

function mealToForm(m: Meal): MealFormData {
  return {
    mealName: m.mealName,
    mealSlug: m.mealSlug,
    description: m.description,
    ingredientsList: [...m.ingredientsList],
    mealCategories: [...m.mealCategories],
    priceInRupees: m.priceInRupees,
    caloriesKcal: m.caloriesKcal,
    proteinInGrams: m.proteinInGrams,
    imageUrl: m.imageUrl,
    imagePublicId: m.imagePublicId,
    isAvailable: m.isAvailable,
    unavailableReason: m.unavailableReason,
    displayOrder: m.displayOrder,
  };
}

/** Auto-generate slug from name */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/* ──────────────────────────────────────────────────────────────
   Meals Page
   ────────────────────────────────────────────────────────────── */
export function Meals(): React.ReactElement {
  const { meals, loading, error, createMeal, updateMeal, deleteMeal, uploadImage } = useMeals();

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<MealFormData>(blankForm());
  const [ingredientInput, setIngredientInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── Filtered meals ── */
  const filtered = meals.filter((m) => {
    if (m.isDeleted) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || m.mealName.toLowerCase().includes(q) || m.mealSlug.includes(q);
    const matchCat = filterCat === 'ALL' || m.mealCategories.includes(filterCat);
    return matchSearch && matchCat;
  });

  /* ── Open modal ── */
  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm());
    setIngredientInput('');
    setSubmitError(null);
    setSubmitSuccess(null);
    setModalOpen(true);
  };

  const openEdit = (m: Meal) => {
    setEditingId(m._id);
    setForm(mealToForm(m));
    setIngredientInput('');
    setSubmitError(null);
    setSubmitSuccess(null);
    setModalOpen(true);
  };

  /* ── Form field updaters ── */
  const set = <K extends keyof MealFormData>(key: K, val: MealFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleNameChange = (val: string) => {
    set('mealName', val);
    if (!editingId) set('mealSlug', toSlug(val));
  };

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      mealCategories: f.mealCategories.includes(cat)
        ? f.mealCategories.filter((c) => c !== cat)
        : [...f.mealCategories, cat],
    }));
  };

  const addIngredient = () => {
    const val = ingredientInput.trim();
    if (val && !form.ingredientsList.includes(val)) {
      set('ingredientsList', [...form.ingredientsList, val]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (idx: number) => {
    set('ingredientsList', form.ingredientsList.filter((_, i) => i !== idx));
  };

  /* ── Image upload ── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      set('imageUrl', res.data.imageUrl);
      set('imagePublicId', res.data.imagePublicId);
    } catch (err: any) {
      setSubmitError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (editingId) {
        await updateMeal(editingId, form);
        setSubmitSuccess('Meal updated successfully!');
      } else {
        await createMeal(form);
        setSubmitSuccess('Meal created successfully!');
      }
      setTimeout(() => setModalOpen(false), 800);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      await deleteMeal(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#49E619] font-bold font-mono-tabular">
            Meal Catalogue
          </p>
          <h1 className="text-2xl font-bold text-white mt-1 font-display-sans">
            Manage Meals
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-[#080808] text-sm font-bold transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add New Meal
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search meals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0D1719] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#49E619]/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', ...MEAL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterCat === cat
                  ? 'bg-[#49E619] text-[#080808]'
                  : 'bg-[#0D1719] text-white/50 border border-white/8 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl bg-[#0D1719] border border-white/8 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-white/30 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading meals…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            {search || filterCat !== 'ALL' ? 'No meals match your filters.' : 'No meals yet. Click "Add New Meal" to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Image</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Meal</th>
                  <th className="text-left px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Categories</th>
                  <th className="text-right px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Price</th>
                  <th className="text-right px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Cal / Protein</th>
                  <th className="text-center px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] text-white/40 uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    {/* Image */}
                    <td className="px-5 py-3">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.mealName} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                          <ImageIcon size={16} className="text-white/20" />
                        </div>
                      )}
                    </td>
                    {/* Name + slug */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{m.mealName}</p>
                      <p className="text-[11px] text-white/30 font-mono-tabular mt-0.5">{m.mealSlug}</p>
                    </td>
                    {/* Categories */}
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {m.mealCategories.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-white/50">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-5 py-3 text-right font-mono-tabular font-bold text-[#49E619]">
                      ₹{m.priceInRupees}
                    </td>
                    {/* Nutrition */}
                    <td className="px-5 py-3 text-right font-mono-tabular text-white/50 text-xs">
                      {m.caloriesKcal} kcal · {m.proteinInGrams}g
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3 text-center">
                      {m.isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#49E619]">
                          <Eye size={12} /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                          <EyeOff size={12} /> Off
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-[#4EDBE2] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === m._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(m._id)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-red-500 text-white cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-white/60 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(m._id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────── CREATE / EDIT MODAL ──────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !submitting && setModalOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-[#0D1719] border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#49E619] font-bold font-mono-tabular">
                  {editingId ? 'Edit Meal' : 'Create New Meal'}
                </p>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {editingId ? form.mealName || 'Untitled' : 'Add to Catalogue'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Success / Error banners */}
              {submitSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#49E619]/10 border border-[#49E619]/30 text-[#49E619] text-sm">
                  <CheckCircle2 size={14} /> {submitSuccess}
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              {/* Row 1: Name + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Meal Name *</label>
                  <input
                    type="text"
                    required
                    value={form.mealName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. High Protein Paneer Bowl"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.mealSlug}
                    onChange={(e) => set('mealSlug', e.target.value)}
                    placeholder="auto-generated-from-name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Brief description of the meal…"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#49E619]/50 resize-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Categories *</label>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        form.mealCategories.includes(cat)
                          ? 'bg-[#49E619] text-[#080808]'
                          : 'bg-[#080808] text-white/40 border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: Price / Calories / Protein */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.priceInRupees || ''}
                    onChange={(e) => set('priceInRupees', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Calories (kcal)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.caloriesKcal || ''}
                    onChange={(e) => set('caloriesKcal', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Protein (g)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.proteinInGrams || ''}
                    onChange={(e) => set('proteinInGrams', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Ingredients</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                    placeholder="Type and press Enter…"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#49E619]/50"
                  />
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {form.ingredientsList.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {form.ingredientsList.map((ing, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#122023] text-xs text-white/70"
                      >
                        {ing}
                        <button type="button" onClick={() => removeIngredient(i)} className="text-white/30 hover:text-red-400 cursor-pointer">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Image */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Meal Image</label>
                <div className="flex items-center gap-4">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#080808] border border-dashed border-white/15 flex items-center justify-center">
                      <ImageIcon size={20} className="text-white/15" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white/50 hover:text-white hover:border-[#49E619]/30 transition-colors cursor-pointer">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploading ? 'Uploading…' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => set('imageUrl', e.target.value)}
                      placeholder="Or paste image URL…"
                      className="w-full px-4 py-2 rounded-xl bg-[#080808] border border-white/10 text-xs text-white/50 placeholder:text-white/15 focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Display Order + Availability */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder || ''}
                    onChange={(e) => set('displayOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white focus:outline-none focus:border-[#49E619]/50 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Availability</label>
                  <button
                    type="button"
                    onClick={() => set('isAvailable', !form.isAvailable)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      form.isAvailable
                        ? 'bg-[#49E619]/15 border border-[#49E619]/30 text-[#49E619]'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {form.isAvailable ? '✓ Available' : '✗ Unavailable'}
                  </button>
                </div>
              </div>

              {/* Unavailable reason (if unavailable) */}
              {!form.isAvailable && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 font-bold mb-1.5">Unavailable Reason</label>
                  <input
                    type="text"
                    value={form.unavailableReason}
                    onChange={(e) => set('unavailableReason', e.target.value)}
                    placeholder="e.g. Seasonal ingredient shortage"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || form.mealCategories.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-[#080808] font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Update Meal' : 'Create Meal'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm cursor-pointer"
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
