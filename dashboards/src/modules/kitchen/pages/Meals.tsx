import React, { useEffect, useState } from 'react';
import { kitchenApi } from '../services/kitchenApi';
import type { Meal } from '../types';
import { useAuth } from '@core/auth/useAuth';
import {
  UtensilsCrossed,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Flame,
  Award,
  Image as ImageIcon,
  Loader2,
  Upload,
} from 'lucide-react';

const CATEGORIES = ['VEG', 'NON-VEG', 'PROTEIN', 'KIDS MEALS', 'FAMILY MEALS'];

interface MealFormData {
  mealName: string;
  mealSlug: string;
  description: string;
  ingredientsList: string;
  mealCategories: string[];
  priceInRupees: number;
  caloriesKcal: number;
  proteinInGrams: number;
  imageUrl: string;
  imagePublicId: string;
  isAvailable: boolean;
  displayOrder: number;
}

const DEFAULT_FORM: MealFormData = {
  mealName: '',
  mealSlug: '',
  description: '',
  ingredientsList: '',
  mealCategories: ['VEG'],
  priceInRupees: 150,
  caloriesKcal: 500,
  proteinInGrams: 15,
  imageUrl: '',
  imagePublicId: '',
  isAvailable: true,
  displayOrder: 1,
};

export function Meals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MealFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  const loadMeals = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    try {
      const res = await kitchenApi.getMeals(user._id);
      setMeals(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, [user?._id]);

  const handleOpenCreate = () => {
    setFormData(DEFAULT_FORM);
    setEditMeal(null);
    setImageUploadError('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (meal: Meal) => {
    setEditMeal(meal);
    setImageUploadError('');
    setFormData({
      mealName: meal.mealName,
      mealSlug: meal.mealSlug || '',
      description: meal.description || '',
      ingredientsList: meal.ingredientsList ? meal.ingredientsList.join(', ') : '',
      mealCategories: meal.mealCategories || ['VEG'],
      priceInRupees: meal.priceInRupees,
      caloriesKcal: meal.caloriesKcal || 0,
      proteinInGrams: meal.proteinInGrams || 0,
      imageUrl: meal.imageUrl || '',
      imagePublicId: meal.imagePublicId || '',
      isAvailable: meal.isAvailable,
      displayOrder: meal.displayOrder || 1,
    });
    setCreateModalOpen(true);
  };

  const handleToggleCategory = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.mealCategories.includes(cat);
      if (exists) {
        return { ...prev, mealCategories: prev.mealCategories.filter((c) => c !== cat) };
      }
      return { ...prev, mealCategories: [...prev.mealCategories, cat] };
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageUploadError('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image must be smaller than 5 MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await kitchenApi.uploadImage(file);
      setFormData((current) => ({
        ...current,
        imageUrl: response.data.imageUrl,
        imagePublicId: response.data.imagePublicId,
      }));
    } catch (uploadError) {
      setImageUploadError(
        uploadError instanceof Error ? uploadError.message : 'Failed to upload image'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const slug =
        formData.mealSlug.trim() ||
        formData.mealName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        mealName: formData.mealName,
        mealSlug: slug,
        description: formData.description,
        ingredientsList: formData.ingredientsList
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        mealCategories: formData.mealCategories,
        priceInRupees: Number(formData.priceInRupees),
        caloriesKcal: Number(formData.caloriesKcal),
        proteinInGrams: Number(formData.proteinInGrams),
        imageUrl: formData.imageUrl,
        imagePublicId: formData.imagePublicId,
        isAvailable: formData.isAvailable,
        displayOrder: Number(formData.displayOrder),
      };

      if (editMeal) {
        await kitchenApi.updateMeal(editMeal._id, payload);
      } else {
        await kitchenApi.createMeal(payload);
      }

      setCreateModalOpen(false);
      await loadMeals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickToggleAvailability = async (meal: Meal) => {
    try {
      await kitchenApi.updateMeal(meal._id, {
        isAvailable: !meal.isAvailable,
      });
      setMeals((prev) =>
        prev.map((m) => (m._id === meal._id ? { ...m, isAvailable: !m.isAvailable } : m))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update meal availability');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await kitchenApi.deleteMeal(deleteId);
      setDeleteId(null);
      await loadMeals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete meal');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMeals = meals.filter((meal) => {
    if (selectedCategory !== 'ALL' && !meal.mealCategories?.includes(selectedCategory)) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = meal.mealName.toLowerCase().includes(q);
      const matchDesc = meal.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Menu & Meal Management</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Create, update dishes, modify prices, and manage live menu availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMeals}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#49E619]/10"
          >
            <Plus size={15} />
            Add New Meal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#0D1719] border border-white/8 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-[#49E619] text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All Categories ({meals.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#49E619] text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meal name or description..."
            className="w-full pl-9 pr-4 py-2 bg-[#0D1719] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#49E619]/50 transition-colors"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      {/* Meals Grid */}
      {loading ? (
        <div className="p-12 text-center bg-[#0D1719] rounded-2xl border border-white/8 text-white/40 text-sm">
          Loading meals catalog...
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="p-12 text-center bg-[#0D1719] rounded-2xl border border-white/8">
          <UtensilsCrossed size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white font-medium text-sm">No meals found</p>
          <p className="text-white/40 text-xs mt-1">Click "Add New Meal" to add dishes to your kitchen menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeals.map((meal) => (
            <div
              key={meal._id}
              className={`rounded-2xl bg-[#0D1719] border transition-all overflow-hidden flex flex-col justify-between ${
                meal.isAvailable ? 'border-white/8 hover:border-white/20' : 'border-red-500/20 opacity-70'
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.mealName}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        meal.isAvailable ? 'hover:scale-105' : 'grayscale opacity-60'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <UtensilsCrossed size={48} />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        meal.isAvailable
                          ? 'bg-[#49E619] text-black shadow-md'
                          : 'bg-red-500 text-white shadow-md'
                      }`}
                    >
                      {meal.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                    {meal.mealCategories?.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/10"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                      {meal.mealName}
                    </h3>
                    <span className="font-bold text-[#49E619] font-mono-tabular text-base whitespace-nowrap">
                      ₹{meal.priceInRupees}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {meal.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-white/50 pt-2 border-t border-white/6">
                    {meal.caloriesKcal > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame size={12} className="text-amber-400" /> {meal.caloriesKcal} kcal
                      </span>
                    )}
                    {meal.proteinInGrams > 0 && (
                      <span className="flex items-center gap-1">
                        <Award size={12} className="text-[#49E619]" /> {meal.proteinInGrams}g protein
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-white/6 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => handleQuickToggleAvailability(meal)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    meal.isAvailable
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-[#49E619]/10 text-[#49E619] hover:bg-[#49E619]/20'
                  }`}
                >
                  {meal.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(meal)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Edit meal"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(meal._id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Delete meal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0D1719] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-[#49E619]" />
                <span>{editMeal ? 'Edit Dish Details' : 'Add New Dish to Menu'}</span>
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mealName}
                    onChange={(e) => setFormData({ ...formData, mealName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                    placeholder="e.g. Paneer Butter Masala Thali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                    Price in Rupees (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.priceInRupees}
                    onChange={(e) => setFormData({ ...formData, priceInRupees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  placeholder="Rich paneer curry served with 3 rotis, jeera rice, and fresh salad"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={formData.caloriesKcal}
                    onChange={(e) => setFormData({ ...formData, caloriesKcal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                    Protein (grams)
                  </label>
                  <input
                    type="number"
                    value={formData.proteinInGrams}
                    onChange={(e) => setFormData({ ...formData, proteinInGrams: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Ingredients (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.ingredientsList}
                  onChange={(e) => setFormData({ ...formData, ingredientsList: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  placeholder="paneer, butter, tomato gravy, wheat flour, basmati rice"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = formData.mealCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#49E619]/20 border-[#49E619] text-[#49E619] font-bold'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/70">
                  Meal Image
                </span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Meal preview"
                      className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/30">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="meal-image-upload"
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 ${
                        uploadingImage ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {uploadingImage ? 'Uploading image...' : formData.imageUrl ? 'Replace image' : 'Choose image'}
                    </label>
                    <input
                      id="meal-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || submitting}
                      className="sr-only"
                    />
                    <p className="text-[11px] text-white/40">JPG, PNG or WebP. Maximum 5 MB.</p>
                  </div>
                </div>
                {imageUploadError && (
                  <p role="alert" className="mt-2 text-xs text-red-400">{imageUploadError}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#49E619]"></div>
                  <span className="ml-3 text-xs font-medium text-white/80">Available on live menu</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#49E619]/10"
                >
                  {uploadingImage ? 'Uploading image...' : submitting ? 'Saving...' : editMeal ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0D1719] border border-red-500/20 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete this dish?</h3>
              <p className="text-xs text-white/60 mt-1">
                This meal will be permanently removed from your kitchen menu and customer searches.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

