import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Ticket,
  Trash2,
  Utensils,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MealCategory,
  CharityToken,
  Order,
  MealProduct,
} from '../data/mealProgram';
import { useMealProgram } from '../context/MealProgramContext';
import { useMeals } from '../hooks';
import { getActiveKitchens, type Kitchen } from '../services/kitchenService';
import { EditorialImage } from '../components/EditorialImage';
import { ScrollReveal } from '../components/ScrollReveal';
import { PlateToHandsSteps } from '../components/PlateToHandsSteps';

const CATEGORIES: MealCategory[] = [
  'ALL',
  'VEG',
  'NON-VEG',
  'PROTEIN',
  'KIDS MEALS',
  'FAMILY MEALS',
];

export const MealBox: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    cartTotalInr,
    sponsoredMealsCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
  } = useMealProgram();

  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [kitchensLoading, setKitchensLoading] = useState(true);
  const [kitchensError, setKitchensError] = useState('');
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const { meals: backendMeals, loading: mealsLoading, error: mealsError } = useMeals(selectedKitchenId || null);

  const [activeCategory, setActiveCategory] = useState<MealCategory>('ALL');
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'CHECKOUT' | 'CONFIRMED'>('CART');
  const [submitting, setSubmitting] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Customer checkout fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [formError, setFormError] = useState('');

  // Confirmed Order & Token state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedTokens, setConfirmedTokens] = useState<CharityToken[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActiveKitchens()
      .then((activeKitchens) => {
        if (!active) return;
        setKitchens(activeKitchens);
        if (activeKitchens.length === 1) setSelectedKitchenId(activeKitchens[0]._id);
      })
      .catch((error: unknown) => {
        if (active) setKitchensError(error instanceof Error ? error.message : 'Failed to load kitchens');
      })
      .finally(() => {
        if (active) setKitchensLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts =
    activeCategory === 'ALL'
      ? backendMeals
      : backendMeals.filter((p) => p.categories.includes(activeCategory));

  const scrollToMeals = () => {
    const el = document.getElementById('meal-box-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCart = () => {
    const el = document.getElementById('your-cart-module');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !deliveryAddress.addressLine1.trim() ||
      !deliveryAddress.area.trim() ||
      !deliveryAddress.city.trim() ||
      !deliveryAddress.state.trim() ||
      !deliveryAddress.pincode.trim()
    ) {
      setFormError('Please complete your name, email, and required delivery address fields.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const result = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        paymentMethod,
      });
      setConfirmedOrder(result.order);
      setConfirmedTokens(result.tokens);
      setCheckoutStep('CONFIRMED');
    } catch (error: any) {
      setFormError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = (tokenStr: string) => {
    navigator.clipboard?.writeText(tokenStr);
    setCopiedToken(tokenStr);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="bg-[#080808] text-white min-h-screen">
      {/* =====================================================================
          HERO SECTION — NOURISH ONE. HELP ANOTHER.
      ====================================================================== */}
      <section className="relative bg-[#080808] pt-28 sm:pt-36 pb-18 sm:pb-24 border-b border-white/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <ScrollReveal>
                <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.22em] text-[#49E619] block mb-3">
                  BUY 1 · GIVE 1 MEAL PROGRAM
                </span>

                <h1 className="font-display-sans uppercase text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.92] text-white">
                  NOURISH ONE.
                  <br />
                  <span className="text-[#49E619]">HELP ANOTHER.</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-white font-semibold leading-relaxed max-w-xl">
                  Buy a nutritious meal for yourself.
                  <br />
                  Every eligible <span className="font-mono-tabular font-bold text-[#B9FF2C]">₹150</span> meal purchase funds a nutritious meal for a child in need.
                </p>

                <p className="mt-4 text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
                  Your meal is freshly cooked and dispatched to your address, while your linked sponsored meal is assigned a unique Charity Token so you can follow its journey to a child at our Hyderabad community centers.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={scrollToMeals}
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] text-sm font-bold tracking-tight transition-colors cursor-pointer"
                  >
                    <span>EXPLORE MEALS</span>
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <Link
                    to="/track-meal"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-[10px] bg-white hover:bg-[#4EDBE2] text-[#080808] text-sm font-bold tracking-tight transition-colors"
                  >
                    <Ticket className="w-4 h-4 text-[#188D44]" />
                    <span>TRACK A MEAL TOKEN</span>
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Dual-Meal Distinction Card */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.14}>
                <div className="bg-[#122023] rounded-[20px] border border-white/15 p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-white/12">
                    <span className="text-xs font-mono-tabular uppercase tracking-widest text-white font-bold">
                      HOW YOUR ₹150 WORKS
                    </span>
                    <span className="text-xs font-mono-tabular font-bold text-[#49E619]">
                      1 PURCHASE = 2 MEALS
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {/* Stream 1: Customer's Purchased Meal */}
                    <div className="rounded-[12px] bg-[#F2F4F3] text-[#122023] p-4 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-widest text-[#188D44] block">
                          MEAL 01 · FOR YOU
                        </span>
                        <h3 className="font-display-sans uppercase text-lg font-black text-[#122023] mt-0.5">
                          Your Purchased Meal Box
                        </h3>
                        <p className="text-xs text-[#122023]/80 mt-1">
                          Freshly prepared in our Secunderabad kitchen and delivered hot to your doorstep.
                        </p>
                      </div>
                      <span className="font-mono-tabular text-lg font-bold text-[#122023] shrink-0">
                        ₹150
                      </span>
                    </div>

                    {/* Stream 2: Sponsored Child Meal */}
                    <div className="rounded-[12px] bg-[#49E619] text-[#122023] p-4 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#122023] font-bold block">
                          MEAL 02 · FOR A CHILD IN NEED
                        </span>
                        <h3 className="font-display-sans uppercase text-lg font-black text-[#122023] mt-0.5">
                          Linked Sponsored Child Meal
                        </h3>
                        <p className="text-xs text-[#122023]/85 font-medium mt-1">
                          Funded by our Buy 1, Give 1 program at zero extra cost to you. Includes a verifiable Charity Token.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono-tabular text-sm line-through text-[#122023]/60 block">
                          ₹150
                        </span>
                        <span className="font-mono-tabular text-[11px] font-bold bg-[#122023] text-[#B9FF2C] px-2 py-0.5 rounded-[4px] uppercase">
                          SPONSORED
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/12 flex items-center justify-between">
                    <span className="text-xs font-mono-tabular uppercase tracking-wider text-white/80 font-bold">
                      YOU PAY ONLY
                    </span>
                    <span className="font-mono-tabular text-2xl font-bold text-[#B9FF2C]">
                      ₹150
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          MAIN SHOPPING & CART EXPERIENCE
      ====================================================================== */}
      <section id="meal-box-catalog" className="bg-[#122023] py-18 sm:py-24">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="mb-8 rounded-[12px] border border-white/12 bg-[#080808]/50 p-5">
            <label htmlFor="kitchen-picker" className="block text-xs font-mono-tabular font-bold uppercase tracking-widest text-[#49E619] mb-2">
              Choose a kitchen
            </label>
            {kitchensLoading ? (
              <p className="text-sm text-white/60">Loading available kitchens…</p>
            ) : kitchensError ? (
              <p role="alert" className="text-sm text-red-300">{kitchensError}</p>
            ) : kitchens.length === 0 ? (
              <p className="text-sm text-white/60">There are no active kitchens available right now.</p>
            ) : (
              <>
                <select
                  id="kitchen-picker"
                  value={selectedKitchenId}
                  onChange={(event) => {
                    if (event.target.value === selectedKitchenId) return;
                    clearCart();
                    setCheckoutStep('CART');
                    setSelectedKitchenId(event.target.value);
                  }}
                  className="w-full max-w-xl rounded-[8px] bg-[#080808] border border-white/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#49E619]"
                >
                  <option value="">Select a kitchen to see its menu</option>
                  {kitchens.map((kitchen) => (
                    <option key={kitchen._id} value={kitchen._id}>{kitchen.name}</option>
                  ))}
                </select>
                {selectedKitchenId && (
                  <p className="mt-2 text-xs text-white/50">
                    {kitchens.find((kitchen) => kitchen._id === selectedKitchenId)?.address}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-12 border-b border-white/12">
            <div>
              <span className="text-xs font-mono-tabular font-bold uppercase tracking-widest text-[#49E619] block mb-1">
                DAILY KITCHEN MENU · ALL MEALS ₹150
              </span>
              <h2 className="font-display-sans uppercase text-3xl sm:text-4xl font-black text-white">
                Select Your Nutritious Meal Box
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Meal Box Categories"
              className="flex flex-wrap items-center gap-2"
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-[8px] text-xs font-mono-tabular font-bold uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#49E619] text-[#080808]'
                        : 'bg-[#080808]/60 text-white/75 border border-white/15 hover:border-[#49E619] hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* LEFT 12 COLUMNS: Meal Box Product Grid (full width now that cart is modal) */}
            <div className="lg:col-span-12">
              {!selectedKitchenId && !kitchensLoading && kitchens.length > 0 && (
                <div className="mb-5 rounded-xl border border-white/10 bg-[#080808]/40 p-5 text-sm text-white/60">
                  Select a kitchen above to browse its available meals.
                </div>
              )}
              {mealsError && (
                <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  Could not load this kitchen's meals: {mealsError}
                </div>
              )}
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((meal) => {
                    const inCartItem = cart.find(
                      (item) => item.product.id === meal.id
                    );
                    return (
                      <motion.div
                        key={meal.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-[18px] bg-[#080808] border border-white/12 flex flex-col justify-between group hover:border-[#49E619]/60 transition-all duration-300 overflow-hidden shadow-xl"
                      >
                        <div>
                          {/* Food Image */}
                          <div className="relative aspect-[4/3] overflow-hidden border-b border-white/10 bg-[#141414]">
                            <EditorialImage
                              src={meal.image}
                              alt={meal.name}
                              className="w-full h-full"
                              imgClassName="group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-3 left-3 rounded-[6px] bg-[#080808]/90 backdrop-blur-xs text-[#49E619] px-2.5 py-1 text-[10px] font-mono-tabular font-bold uppercase tracking-widest">
                              {meal.categories.join(' · ')}
                            </div>
                            <div className="absolute bottom-3 right-3 rounded-[6px] bg-[#B9FF2C] text-[#122023] px-2.5 py-1 text-[11px] font-mono-tabular font-bold">
                              {meal.proteinGrams}g Protein · {meal.calories} kcal
                            </div>
                          </div>

                          {/* Product Body */}
                          <div className="p-6">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display-sans uppercase text-2xl font-black text-white group-hover:text-[#49E619] transition-colors">
                                {meal.name}
                              </h3>
                              <span className="font-mono-tabular text-xl font-bold text-[#49E619] shrink-0">
                                ₹{meal.priceInr}
                              </span>
                            </div>

                            {/* Ingredients with middle dot separators */}
                            <p className="mt-2 text-xs font-mono-tabular text-[#4EDBE2] font-semibold">
                              {meal.ingredients.join(' • ')}
                            </p>

                            <p className="mt-2 text-sm text-white/70 leading-relaxed">
                              {meal.shortDescription}
                            </p>

                            {/* 3 Verification Checkmarks */}
                            <ul className="mt-5 pt-4 border-t border-white/10 space-y-2 text-xs text-white/85">
                              <li className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-[#49E619] shrink-0" />
                                <span>Freshly prepared</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-[#49E619] shrink-0" />
                                <span>Nutritionally balanced</span>
                              </li>
                              <li className="flex items-center gap-2 font-bold text-[#B9FF2C]">
                                <Check className="w-3.5 h-3.5 text-[#49E619] shrink-0" />
                                <span>Supports a child in need (1-for-1)</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="px-6 pb-6">
                          {inCartItem ? (
                            <div className="flex items-center justify-between rounded-[10px] bg-[#122023] border border-[#49E619]/40 px-4 py-2.5">
                              <span className="text-xs font-mono-tabular font-bold uppercase text-[#49E619]">
                                In Cart ({inCartItem.quantity})
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      meal.id,
                                      inCartItem.quantity - 1
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                  className="w-7 h-7 rounded-[6px] bg-[#080808] border border-white/20 text-white flex items-center justify-center hover:bg-[#49E619] hover:text-[#080808] transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono-tabular text-sm font-bold w-5 text-center text-white">
                                  {inCartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      meal.id,
                                      inCartItem.quantity + 1
                                    )
                                  }
                                  aria-label="Increase quantity"
                                  className="w-7 h-7 rounded-[6px] bg-[#080808] border border-white/20 text-white flex items-center justify-center hover:bg-[#49E619] hover:text-[#080808] transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(meal);
                                if (checkoutStep === 'CONFIRMED') {
                                  setCheckoutStep('CART');
                                }
                              }}
                              className="w-full py-3.5 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <span>ADD TO CART</span>
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!mealsLoading && selectedKitchenId && filteredProducts.length === 0 && !mealsError && (
                  <p className="col-span-full rounded-xl border border-white/10 bg-[#080808]/40 p-8 text-center text-sm text-white/55">
                    No available meals in this kitchen match the selected category.
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6-STEP PIPELINE: FROM YOUR PLATE TO A CHILD'S HANDS
      ====================================================================== */}
      <section className="bg-[#080808] py-16 sm:py-24 border-t border-white/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <PlateToHandsSteps />
        </div>
      </section>

      {/* Mobile Floating Cart Pill */}
      {cartCount > 0 && checkoutStep !== 'CONFIRMED' && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
          <button
            type="button"
            onClick={scrollToCart}
            className="w-full rounded-[12px] bg-[#49E619] text-[#080808] py-4 px-5 shadow-2xl flex items-center justify-between font-mono-tabular text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <span>
              {cartCount} {cartCount === 1 ? 'Meal' : 'Meals'} (+{sponsoredMealsCount} Child Meal)
            </span>
            <span>
              VIEW CART · ₹{cartTotalInr} →
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
