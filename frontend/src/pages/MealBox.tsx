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
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MealCategory,
  CharityToken,
  Order,
  MealProduct,
} from '../data/mealProgram';
import { useMealProgram } from '../context/MealProgramContext';
import { useAuth } from '../context/AuthContext';
import { useMeals } from '../hooks';
import { getActiveKitchens, type Kitchen } from '../services/kitchenService';
import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  type SavedAddress,
  updateAddress,
} from '../services/addressService';
import { AuthModal } from '../components/AuthModal';
import { SavedAddressPicker } from '../components/SavedAddressPicker';
import { EditorialImage } from '../components/EditorialImage';
import { ScrollReveal } from '../components/ScrollReveal';
import { PlateToHandsSteps } from '../components/PlateToHandsSteps';
import AddressSection from '../components/AddressSection';
import type { DeliveryAddress, DeliveryPoint } from '../services/orderService';

const CATEGORIES: MealCategory[] = [
  'ALL',
  'VEG',
  'NON-VEG',
  'PROTEIN',
  'KIDS MEALS',
  'FAMILY MEALS',
];

const EMPTY_ADDRESS: DeliveryAddress = {
  addressLine1: '',
  addressLine2: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

export const MealBox: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    authError,
    refreshUser,
    signIn,
    signUp,
    verifyEmail,
    resendVerificationCode,
    sendPasswordResetCode,
    resetPassword,
  } = useAuth();
  const {
    cart,
    cartCount,
    cartTotalInr,
    sponsoredMealsCount,
    isCartOpen,
    setIsCartOpen,
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressActionLoading, setAddressActionLoading] = useState(false);

  // Customer checkout fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPoint | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [formError, setFormError] = useState('');

  // Confirmed Order & Token state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedTokens, setConfirmedTokens] = useState<CharityToken[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isCartOpen && checkoutStep !== 'CHECKOUT') return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || submitting) return;
      if (checkoutStep === 'CHECKOUT') {
        setCheckoutStep('CART');
        setIsCartOpen(true);
      } else {
        setIsCartOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkoutStep, isCartOpen, setIsCartOpen, submitting]);

  useEffect(() => {
    let active = true;
    getActiveKitchens()
      .then((activeKitchens) => {
        if (!active) return;
        setKitchens(activeKitchens);
        if (activeKitchens.length > 0) setSelectedKitchenId(activeKitchens[0]._id);
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
      : backendMeals.filter((meal) =>
          meal.categories.some(
            (category) => category.trim().toUpperCase() === activeCategory
          )
        );

  const scrollToMeals = () => {
    const el = document.getElementById('meal-box-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const prepareCheckout = async (authenticatedUser = user) => {
    if (!authenticatedUser) return;
    if (!authenticatedUser.roles.includes('customer')) {
      throw new Error('A customer account is required to place a meal order.');
    }
    setCustomerEmail(authenticatedUser.email || '');
    const addresses = await getMyAddresses();
    setSavedAddresses(addresses);
    const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
    setSelectedAddressId(defaultAddress?._id || null);
    setIsAddingNewAddress(!defaultAddress);
    if (defaultAddress) {
      setCustomerName(defaultAddress.customerName);
      setCustomerPhone(defaultAddress.customerPhone || authenticatedUser.phone || '');
      setDeliveryAddress({
        addressLine1: defaultAddress.addressLine1,
        addressLine2: defaultAddress.addressLine2 || '',
        area: defaultAddress.area,
        landmark: defaultAddress.landmark || '',
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
      });
      setDeliveryLocation(defaultAddress.location);
    } else {
      setCustomerName(authenticatedUser.name);
      setCustomerPhone(authenticatedUser.phone || '');
      setDeliveryAddress(EMPTY_ADDRESS);
      setDeliveryLocation(null);
    }
    setFormError('');
    setCheckoutStep('CHECKOUT');
    setIsCartOpen(false);
  };

  const selectSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address._id);
    setIsAddingNewAddress(false);
    setEditingAddressId(null);
    setCustomerName(address.customerName);
    setCustomerPhone(address.customerPhone || '');
    setDeliveryAddress({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      area: address.area,
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setDeliveryLocation(address.location);
    setFormError('');
  };

  const addNewAddress = () => {
    setSelectedAddressId(null);
    setIsAddingNewAddress(true);
    setEditingAddressId(null);
    setCustomerName(user?.name || '');
    setCustomerPhone(user?.phone || '');
    setDeliveryAddress(EMPTY_ADDRESS);
    setDeliveryLocation(null);
    setFormError('');
  };

  const editSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address._id);
    setIsAddingNewAddress(false);
    setEditingAddressId(address._id);
    setCustomerName(address.customerName);
    setCustomerPhone(address.customerPhone || '');
    setDeliveryAddress({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      area: address.area,
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setDeliveryLocation(address.location);
    setFormError('');
  };

  const saveEditedAddress = async () => {
    if (!editingAddressId) return;
    if (
      !customerName.trim() ||
      !deliveryAddress.addressLine1.trim() ||
      !deliveryAddress.area.trim() ||
      !deliveryAddress.city.trim() ||
      !deliveryAddress.state.trim() ||
      !deliveryAddress.pincode.trim() ||
      !deliveryLocation
    ) {
      setFormError('Complete the required address fields and confirm its delivery pin.');
      return;
    }

    setAddressActionLoading(true);
    setFormError('');
    try {
      const currentAddress = savedAddresses.find((address) => address._id === editingAddressId);
      if (!currentAddress) throw new Error('The address could not be found. Refresh and try again.');
      const updatedAddress = await updateAddress(editingAddressId, {
        ...deliveryAddress,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        label: currentAddress.label || 'home',
        location: deliveryLocation,
      });
      setSavedAddresses((previous) => previous.map((address) =>
        address._id === updatedAddress._id ? updatedAddress : address
      ));
      selectSavedAddress(updatedAddress);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not update this address.');
    } finally {
      setAddressActionLoading(false);
    }
  };

  const removeSavedAddress = async (address: SavedAddress) => {
    if (!window.confirm('Delete this saved delivery address?')) return;
    setAddressActionLoading(true);
    setFormError('');
    try {
      await deleteAddress(address._id);
      const remaining = savedAddresses.filter((saved) => saved._id !== address._id);
      const nextAddress = remaining.find((saved) => saved.isDefault) || remaining[0];
      const updatedAddresses = address.isDefault && nextAddress
        ? remaining.map((saved) => ({ ...saved, isDefault: saved._id === nextAddress._id }))
        : remaining;
      setSavedAddresses(updatedAddresses);
      if (selectedAddressId === address._id || editingAddressId === address._id) {
        if (nextAddress) {
          const nextSavedAddress = updatedAddresses.find((saved) => saved._id === nextAddress._id);
          if (nextSavedAddress) selectSavedAddress(nextSavedAddress);
        } else {
          setSelectedAddressId(null);
          setEditingAddressId(null);
          setIsAddingNewAddress(true);
          setCustomerName(user?.name || '');
          setCustomerPhone(user?.phone || '');
          setDeliveryAddress(EMPTY_ADDRESS);
          setDeliveryLocation(null);
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not delete this address.');
    } finally {
      setAddressActionLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    setFormError('');
    try {
      const currentUser = user || await refreshUser();
      if (!currentUser) {
        setIsCartOpen(false);
        setAuthModalOpen(true);
        return;
      }
      await prepareCheckout(currentUser);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not verify your account.');
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      setFormError('Save the address changes or choose another address before placing your order.');
      return;
    }
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
    if (!deliveryLocation) {
      setFormError('Choose and confirm the delivery pin before placing your order.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const selectedAddress = savedAddresses.find((address) => address._id === selectedAddressId);
      if (selectedAddressId && !selectedAddress) {
        throw new Error('The selected delivery address is no longer available. Choose another address.');
      }
      if (!selectedAddress && savedAddresses.length >= 3) {
        throw new Error('You can save up to 3 addresses. Select one of your saved addresses to continue.');
      }
      const createdAddress = selectedAddress ? null : await createAddress({
        ...deliveryAddress,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        label: 'home',
        isDefault: savedAddresses.length === 0,
        location: deliveryLocation,
      });
      if (createdAddress) {
        setSavedAddresses((previous) => [...previous, createdAddress]);
        setSelectedAddressId(createdAddress._id);
        setIsAddingNewAddress(false);
      }
      const addressId = selectedAddress?._id || createdAddress?._id;
      if (!addressId) throw new Error('Could not save your delivery address. Please try again.');
      const result = await placeOrder({
        addressId,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        paymentMethod,
      });
      setConfirmedOrder(result.order);
      setConfirmedTokens(result.tokens);
      setCheckoutStep('CONFIRMED');
      setIsCartOpen(true);
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
            <select
              id="kitchen-picker"
              value={selectedKitchenId}
              disabled={kitchensLoading || Boolean(kitchensError) || kitchens.length === 0}
              onChange={(event) => {
                if (event.target.value === selectedKitchenId) return;
                clearCart();
                setCheckoutStep('CART');
                setSelectedKitchenId(event.target.value);
              }}
              className="w-full max-w-xl rounded-[8px] bg-[#080808] border border-white/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#49E619] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {kitchensLoading
                  ? 'Loading available kitchens…'
                  : kitchensError
                    ? 'Kitchens unavailable'
                    : kitchens.length === 0
                      ? 'No active kitchens available'
                      : 'Select a kitchen to see its menu'}
              </option>
              {kitchens.map((kitchen) => (
                <option key={kitchen._id} value={kitchen._id}>{kitchen.name}</option>
              ))}
            </select>
            {kitchensError ? (
              <p role="alert" className="mt-2 text-sm text-red-300">{kitchensError}</p>
            ) : kitchensLoading ? (
              <p role="status" className="mt-2 text-sm text-white/60">Loading available kitchens…</p>
            ) : kitchens.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">There are no active kitchens available right now.</p>
            ) : selectedKitchenId ? (
              <p className="mt-2 text-xs text-white/50">
                {kitchens.find((kitchen) => kitchen._id === selectedKitchenId)?.address}
              </p>
            ) : null}
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

          <div className="grid grid-cols-1 gap-10 items-start">
            {/* Meal Box Product Grid */}
            <div>
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
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
          className="rounded-[14px] bg-[#080808] border border-white/12 flex flex-col justify-between group hover:border-[#49E619]/60 transition-all duration-300 overflow-hidden shadow-xl"
        >
          <div>
            {/* Food Image (Shorter aspect ratio for compact height) */}
            <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#141414]">
              <EditorialImage
                src={meal.image}
                alt={meal.name}
                className="w-full h-full"
                imgClassName="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-2 left-2 rounded-[5px] bg-[#080808]/90 backdrop-blur-xs text-[#49E619] px-2 py-0.5 text-[9px] font-mono-tabular font-bold uppercase tracking-wider">
                {meal.categories.join(' · ')}
              </div>
              <div className="absolute bottom-2 right-2 rounded-[5px] bg-[#B9FF2C] text-[#122023] px-2 py-0.5 text-[10px] font-mono-tabular font-bold">
                {meal.proteinGrams}g Protein · {meal.calories} kcal
              </div>
            </div>

            {/* Product Body (Tighter padding & smaller text) */}
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display-sans uppercase text-base font-black text-white group-hover:text-[#49E619] transition-colors leading-tight">
                  {meal.name}
                </h3>
                <span className="font-mono-tabular text-base font-bold text-[#49E619] shrink-0">
                  ₹{meal.priceInr}
                </span>
              </div>

              {/* Ingredients */}
              <p className="mt-1.5 text-[11px] font-mono-tabular text-[#4EDBE2] font-semibold line-clamp-1">
                {meal.ingredients.join(' • ')}
              </p>

              {/* Short Description (Capped at 2 lines so card heights stay even) */}
              <p className="mt-1.5 text-xs text-white/70 leading-snug line-clamp-2">
                {meal.shortDescription}
              </p>

              {/* 3 Verification Checkmarks */}
              <ul className="mt-3 pt-2.5 border-t border-white/10 space-y-1 text-[11px] text-white/85">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#49E619] shrink-0" />
                  <span>Freshly prepared</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#49E619] shrink-0" />
                  <span>Nutritionally balanced</span>
                </li>
                <li className="flex items-center gap-1.5 font-bold text-[#B9FF2C]">
                  <Check className="w-3 h-3 text-[#49E619] shrink-0" />
                  <span>Supports a child in need (1-for-1)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="px-3.5 pb-3.5">
            {inCartItem ? (
              <div className="flex items-center justify-between rounded-[8px] bg-[#122023] border border-[#49E619]/40 px-3 py-1.5">
                <span className="text-[11px] font-mono-tabular font-bold uppercase text-[#49E619]">
                  In Cart ({inCartItem.quantity})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        meal.id,
                        inCartItem.quantity - 1
                      )
                    }
                    aria-label="Decrease quantity"
                    className="w-6 h-6 rounded-[5px] bg-[#080808] border border-white/20 text-white flex items-center justify-center hover:bg-[#49E619] hover:text-[#080808] transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono-tabular text-xs font-bold w-4 text-center text-white">
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
                    className="w-6 h-6 rounded-[5px] bg-[#080808] border border-white/20 text-white flex items-center justify-center hover:bg-[#49E619] hover:text-[#080808] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
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
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>ADD TO CART</span>
                <Plus className="w-3.5 h-3.5" />
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

            <AnimatePresence>
              {isCartOpen && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsCartOpen(false);
                  }}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cart-dialog-title"
                    className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[18px] shadow-2xl"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                  <div
                    id="your-cart-module"
                    className="rounded-[18px] bg-[#F2F4F3] text-[#122023] border border-white/20 shadow-2xl p-6 sm:p-7"
                  >
                {/* =========================================================
                    STATE 3: ORDER CREATED
                ========================================================== */}
                {checkoutStep === 'CONFIRMED' && confirmedOrder ? (
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#49E619] text-[#122023] text-xs font-mono-tabular font-bold uppercase tracking-widest mb-4">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ORDER SUBMITTED</span>
                    </div>

                    <h3 id="cart-dialog-title" className="font-display-sans uppercase text-2xl font-black text-[#122023]">
                      Your order request has been submitted.
                    </h3>
                    <p className="mt-2 text-sm text-[#122023]/75">
                      Order <strong>{confirmedOrder.orderNumber}</strong> is awaiting payment. No payment has been processed.
                    </p>
                    <Link
                      to={`/track-meal?orderNumber=${encodeURIComponent(confirmedOrder.orderNumber || '')}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`}
                      className="mt-3 inline-flex text-sm font-bold text-[#188D44] underline"
                    >
                      View your order status
                    </Link>

                    {confirmedTokens.length > 0 ? (
                      <div className="mt-5 rounded-[12px] bg-[#122023] text-white p-5">
                        <span className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-white/60 block">
                          YOUR MEAL TOKEN
                        </span>
                        {confirmedTokens.map((tok) => (
                          <div
                            key={tok.id}
                            className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-white/10 first:border-t-0 first:pt-0"
                          >
                            <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#49E619] tracking-wider">
                              {tok.tokenNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyToken(tok.tokenNumber)}
                              className="inline-flex items-center gap-1 rounded-[6px] text-[11px] font-mono-tabular uppercase tracking-wider bg-white/10 hover:bg-[#49E619] hover:text-[#080808] px-2.5 py-1.5 text-white transition-colors cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>
                                {copiedToken === tok.tokenNumber ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 rounded-xl border border-[#122023]/15 bg-white p-4 text-sm text-[#122023]/70">
                        Charity meal-token tracking is not available for this order yet.
                      </p>
                    )}

                    {/* Clear Dual-Stream Summary: Customer Meal vs Sponsored Child Meal */}
                    <div className="mt-5 space-y-3 text-xs border-y border-[#122023]/12 py-4">
                      <div className="rounded-[10px] bg-white p-3 border border-[#122023]/10">
                        <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#6F6F6F] block">
                          1. YOUR PURCHASED MEAL (FOR YOU)
                        </span>
                        <div className="font-bold text-[#122023] text-sm mt-0.5 flex items-center justify-between">
                          <span>Order total</span>
                          <span className="font-mono-tabular">
                            ₹{confirmedOrder.totalAmountInr}
                          </span>
                        </div>
                        <span className="mt-1 inline-block text-[11px] text-[#188D44] font-semibold">
                          Order status: {confirmedOrder.customerMealStatus.toLowerCase()} · Payment: {confirmedOrder.paymentStatus?.toLowerCase() || 'pending'}
                        </span>
                      </div>

                      <div className="rounded-[10px] bg-[#B9FF2C] p-3 border border-[#122023]/15">
                        <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#122023] font-bold block">
                          2. SPONSORED MEAL (FOR A CHILD IN NEED)
                        </span>
                        <div className="font-bold text-[#122023] text-sm mt-0.5">
                          {confirmedOrder.sponsoredMealsCount} nutritious{' '}
                          {confirmedOrder.sponsoredMealsCount === 1 ? 'meal' : 'meals'}{' '}
                          for a child
                        </div>
                        <span className="mt-1 inline-block text-[11px] text-[#122023]/85">
                          Sponsorship allocation is pending payment confirmation.
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {confirmedTokens.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/track-meal?token=${encodeURIComponent(confirmedTokens[0].tokenNumber)}`
                            )
                          }
                          className="w-full py-4 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#3cd110] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>TRACK YOUR IMPACT</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('CART')}
                        className="w-full py-3 px-4 rounded-[10px] bg-white hover:bg-[#122023] text-[#122023] hover:text-white border border-[#122023]/20 font-mono-tabular text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        ORDER ANOTHER MEAL BOX
                      </button>
                    </div>
                  </div>
                ) : (
                  /* =========================================================
                      STATE 1 & 2: YOUR CART & CHECKOUT
                  ========================================================== */
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#122023]/15">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#188D44]" />
                      <h3 id="cart-dialog-title" className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#122023]">
                          YOUR CART
                        </h3>
                      </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular text-xs font-bold text-[#122023]/70">
                        {cartCount} {cartCount === 1 ? 'Meal' : 'Meals'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCartOpen(false)}
                        aria-label="Close cart"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#122023]/20 bg-white text-[#122023] transition-colors hover:bg-[#122023] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    </div>

                    {cart.length === 0 ? (
                      <div className="py-12 text-center">
                        <Utensils className="w-8 h-8 text-[#122023]/40 mx-auto mb-3 stroke-[1.5]" />
                        <p className="font-display-sans uppercase text-xl font-black text-[#122023]">
                          Your meal box is empty
                        </p>
                        <p className="text-xs text-[#122023]/70 mt-1.5 max-w-xs mx-auto leading-relaxed">
                          Add any ₹150 meal box from the menu to nourish yourself
                          and sponsor a linked hot meal for a child.
                        </p>
                        {backendMeals.length > 0 && (
                          <button
                            type="button"
                            onClick={() => addToCart(backendMeals[0])}
                            className="mt-5 px-5 py-3 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            + Quick Add {backendMeals[0].name} (₹{backendMeals[0].priceInr})
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Itemized Cart List */}
                        <div className="divide-y divide-[#122023]/10 my-4 max-h-64 overflow-y-auto pr-1">
                          {cart.map((item) => (
                            <div key={item.product.id} className="py-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-display-sans uppercase text-lg font-black text-[#122023]">
                                    {item.product.name}
                                  </h4>
                                  <span className="font-mono-tabular text-sm font-bold text-[#188D44] block">
                                    ₹{item.product.priceInr}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product.id)}
                                  aria-label={`Remove ${item.product.name}`}
                                  className="text-[#122023]/50 hover:text-[#122023] transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between text-xs">
                                <span className="text-[#122023]/70 font-mono-tabular">
                                  Quantity: {item.quantity}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.quantity - 1
                                      )
                                    }
                                    aria-label="Decrease quantity"
                                    className="w-6 h-6 rounded-[4px] bg-white border border-[#122023]/20 flex items-center justify-center hover:bg-[#122023] hover:text-white cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-mono-tabular text-xs font-bold w-5 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.quantity + 1
                                      )
                                    }
                                    aria-label="Increase quantity"
                                    className="w-6 h-6 rounded-[4px] bg-white border border-[#122023]/20 flex items-center justify-center hover:bg-[#122023] hover:text-white cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Exact Requested Breakdown: YOUR MEAL vs CHILD MEAL vs TOTAL */}
                        <div className="border-t border-b border-[#122023]/15 py-4 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#122023] block">
                                YOUR MEAL
                              </span>
                              <span className="text-[11px] text-[#122023]/70">
                                Prepared fresh for your delivery
                              </span>
                            </div>
                            <span className="font-mono-tabular text-base font-bold text-[#122023]">
                              ₹{cartTotalInr}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-[10px] bg-[#B9FF2C] p-3">
                            <div>
                              <span className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#122023] block">
                                CHILD MEAL ({sponsoredMealsCount}×)
                              </span>
                              <span className="text-[11px] text-[#122023] font-semibold">
                                Sponsored by your purchase
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono-tabular text-xs text-[#122023]/60 line-through block">
                                ₹{cartTotalInr}
                              </span>
                              <span className="font-mono-tabular text-xs font-bold text-[#188D44]">
                                ₹0 EXTRA
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total Row */}
                        <div className="py-4 flex items-center justify-between">
                          <span className="font-mono-tabular text-sm font-bold uppercase tracking-widest text-[#122023]">
                            TOTAL
                          </span>
                          <span className="font-mono-tabular text-2xl font-bold text-[#122023]">
                            ₹{cartTotalInr}
                          </span>
                        </div>

                        {/* Prominent Message */}
                        <div className="rounded-[10px] bg-[#122023] text-white p-3.5 text-xs leading-relaxed flex items-start gap-2.5">
                          <Heart className="w-4 h-4 text-[#49E619] fill-[#49E619] shrink-0 mt-0.5" />
                          <p>
                            “Your purchase helps us provide a nutritious meal to a
                            child in need.”
                          </p>
                        </div>

                        {(formError || authError) && (
                          <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
                            {formError || authError}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleProceedToCheckout()}
                          disabled={authLoading}
                          className="mt-5 w-full py-4 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#3cd110] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>{authLoading ? 'CHECKING ACCOUNT…' : `PROCEED TO ₹${cartTotalInr} CHECKOUT`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {checkoutStep === 'CHECKOUT' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting) {
                setCheckoutStep('CART');
                setIsCartOpen(true);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-dialog-title"
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[18px] bg-[#F2F4F3] text-[#122023] shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#122023]/15 bg-[#F2F4F3] px-5 py-4 sm:px-7">
                <div>
                  <h2
                    id="checkout-dialog-title"
                    className="font-display-sans uppercase text-xl font-black"
                  >
                    Delivery & Payment Details
                  </h2>
                  <p className="mt-1 text-xs text-[#122023]/65">
                    Complete your details to place your ₹{cartTotalInr} order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutStep('CART');
                    setIsCartOpen(true);
                  }}
                  disabled={submitting}
                  aria-label="Close checkout"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#122023]/20 bg-white text-[#122023] transition-colors hover:bg-[#122023] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={handleCompletePayment}
                className="space-y-4 p-5 sm:p-7"
              >
                <div>
                  <label className="mb-1 block text-[11px] font-mono-tabular uppercase text-[#122023]/70">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-[8px] border border-[#122023]/20 bg-white px-3 py-2.5 text-sm text-[#122023] focus:border-[#122023] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-mono-tabular uppercase text-[#122023]/70">
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      className="w-full rounded-[8px] border border-[#122023]/20 bg-white px-3 py-2.5 text-sm text-[#122023] focus:border-[#122023] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-mono-tabular uppercase text-[#122023]/70">
                      Phone (SMS/WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      className="w-full rounded-[8px] border border-[#122023]/20 bg-white px-3 py-2.5 text-sm text-[#122023] focus:border-[#122023] focus:outline-none"
                    />
                  </div>
                </div>

                <SavedAddressPicker
                  addresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  isAddingNewAddress={isAddingNewAddress}
                  editingAddressId={editingAddressId}
                  isBusy={addressActionLoading}
                  onSelect={selectSavedAddress}
                  onEdit={editSavedAddress}
                  onDelete={(address) => void removeSavedAddress(address)}
                  onAddNew={addNewAddress}
                />
                {(isAddingNewAddress || editingAddressId) && (
                  <AddressSection
                    value={{ address: deliveryAddress, location: deliveryLocation }}
                    onChange={({ address, location }) => {
                      setDeliveryAddress({
                        ...address,
                        addressLine2: address.addressLine2 || '',
                        landmark: address.landmark || '',
                      });
                      setDeliveryLocation(location);
                    }}
                  />
                )}
                {editingAddressId && (
                  <button
                    type="button"
                    onClick={() => void saveEditedAddress()}
                    disabled={addressActionLoading || submitting}
                    className="w-full rounded-[8px] border border-[#122023]/20 bg-white px-4 py-3 text-sm font-bold text-[#122023] hover:border-[#188D44] disabled:opacity-50"
                  >
                    {addressActionLoading ? 'Saving address…' : 'Save address changes'}
                  </button>
                )}
                {editingAddressId && (
                  <p className="text-xs text-[#122023]/65">
                    Save the address changes or select another saved address before placing your order.
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-[11px] font-mono-tabular uppercase text-[#122023]/70">
                    Payment Method
                  </label>
                  <p className="mb-2 text-[11px] text-[#122023]/60">
                    Payments are not processed yet; this selection is saved as a preference and the order remains pending payment.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'CARD', 'NET_BANKING'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-[6px] border py-2 text-[11px] font-mono-tabular font-bold cursor-pointer ${
                          paymentMethod === method
                            ? 'border-[#122023] bg-[#122023] text-white'
                            : 'border-[#122023]/20 bg-white text-[#122023]/70'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-semibold text-red-600">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || addressActionLoading || Boolean(editingAddressId) || !deliveryLocation}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#49E619] px-5 py-4 text-xs font-mono-tabular font-bold uppercase tracking-widest text-[#080808] transition-colors hover:bg-[#3cd110] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{submitting ? 'PLACING ORDER…' : `PLACE ORDER · ₹${cartTotalInr}`}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
        }}
        onAuthenticated={async () => {
          const authenticatedUser = await refreshUser();
          if (!authenticatedUser) throw new Error('Sign in is required to continue checkout.');
          await prepareCheckout(authenticatedUser);
        }}
        onSignIn={signIn}
        onSignUp={signUp}
        onVerifyEmail={verifyEmail}
        onResendVerificationCode={resendVerificationCode}
        onForgotPassword={sendPasswordResetCode}
        onResetPassword={resetPassword}
      />

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
            onClick={() => setIsCartOpen(true)}
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
