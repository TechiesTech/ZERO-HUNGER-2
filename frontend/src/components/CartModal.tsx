import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Heart, ArrowRight, Utensils, CheckCircle2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import type { DeliveryAddress, DeliveryPoint } from '../services/orderService';
import AddressSection from './AddressSection';
import { SavedAddressPicker } from './SavedAddressPicker';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSignIn: () => void;
}

const EMPTY_ADDRESS: DeliveryAddress = {
  addressLine1: '',
  addressLine2: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onRequestSignIn }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
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
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const { meals: backendMeals, loading: mealsLoading } = useMeals(selectedKitchenId || null);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'CHECKOUT' | 'CONFIRMED'>('CART');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPoint | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressActionLoading, setAddressActionLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [confirmedTokens, setConfirmedTokens] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && kitchens.length === 0 && !kitchensLoading) {
      let active = true;
      getActiveKitchens()
        .then((activeKitchens) => {
          if (!active) return;
          setKitchens(activeKitchens);
          if (activeKitchens.length === 1) setSelectedKitchenId(activeKitchens[0]._id);
        })
        .catch((error: unknown) => {
          console.error('Failed to load kitchens:', error);
        })
        .finally(() => {
          if (active) setKitchensLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [isOpen, kitchens.length, kitchensLoading]);

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

  const beginAddingAddress = () => {
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
    setCheckoutLoading(true);
    try {
      const currentUser = user || await refreshUser();
      if (!currentUser) {
        onRequestSignIn();
        return;
      }
      if (!currentUser.roles.includes('customer')) {
        setFormError('A customer account is required to place a meal order.');
        return;
      }

      const addresses = await getMyAddresses();
      const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
      setSavedAddresses(addresses);
      setCustomerName(defaultAddress?.customerName || currentUser.name);
      setCustomerEmail(currentUser.email || '');
      setCustomerPhone(defaultAddress?.customerPhone || currentUser.phone || '');
      setSelectedAddressId(defaultAddress?._id || null);
      setIsAddingNewAddress(!defaultAddress);
      setDeliveryAddress(defaultAddress ? {
        addressLine1: defaultAddress.addressLine1,
        addressLine2: defaultAddress.addressLine2 || '',
        area: defaultAddress.area,
        landmark: defaultAddress.landmark || '',
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
      } : EMPTY_ADDRESS);
      setDeliveryLocation(defaultAddress?.location || null);
      setCheckoutStep('CHECKOUT');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not load your saved addresses.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (editingAddressId) {
      setFormError('Save the address changes or choose another address before placing your order.');
      return;
    }
    if (!user) {
      onRequestSignIn();
      return;
    }
    if (!deliveryLocation) {
      setFormError('Choose and confirm the delivery pin before placing your order.');
      return;
    }

    setSubmitting(true);
    try {
      let addressId = selectedAddressId;
      const selectedAddress = savedAddresses.find((address) => address._id === selectedAddressId);
      if (addressId && !selectedAddress) {
        throw new Error('The selected delivery address is no longer available. Choose another address.');
      }
      if (!addressId) {
        if (!isAddingNewAddress) {
          throw new Error('Select a saved address or add a new one to continue.');
        }
        if (savedAddresses.length >= 3) {
          throw new Error('You can save up to 3 addresses. Select one of your saved addresses to continue.');
        }
        const createdAddress = await createAddress({
          ...deliveryAddress,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          label: 'home',
          isDefault: savedAddresses.length === 0,
          location: deliveryLocation,
        });
        addressId = createdAddress._id;
        setSavedAddresses((previous) => [...previous, createdAddress]);
        setSelectedAddressId(createdAddress._id);
        setIsAddingNewAddress(false);
      }

      if (!addressId) throw new Error('Could not save your delivery address. Please try again.');
      const result = await placeOrder({
        addressId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress,
        paymentMethod,
      });
      setConfirmedOrder(result.order);
      setConfirmedTokens(result.tokens);
      setCheckoutStep('CONFIRMED');
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#080808]/80 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl rounded-[18px] bg-[#F2F4F3] text-[#122023] border border-white/20 shadow-2xl overflow-hidden my-8"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-[#122023] text-white border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#188D44]" />
                <h2
                  id="cart-modal-title"
                  className="font-display-sans uppercase text-xl sm:text-2xl font-black text-white"
                >
                  YOUR CART
                </h2>
                <span className="font-mono-tabular text-xs font-bold text-[#49E619] ml-2">
                  {cartCount} {cartCount === 1 ? 'Meal' : 'Meals'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart dialog"
                className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white/70 hover:text-[#080808] hover:bg-[#49E619] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
              {checkoutStep === 'CONFIRMED' && confirmedOrder ? (
                /* Order Confirmed State */
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#49E619] text-[#122023]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono-tabular font-bold uppercase tracking-[0.2em] text-[#188D44]">
                    ORDER SUBMITTED
                  </span>
                  <h3 className="font-display-sans uppercase text-2xl font-black text-[#122023] mt-2">
                    Your order request has been submitted.
                  </h3>
                  <p className="mt-2 text-sm text-[#122023]/75">
                    Order <strong>{confirmedOrder.orderNumber}</strong> is awaiting payment.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/track-order?orderNumber=${encodeURIComponent(confirmedOrder.orderNumber || '')}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`);
                    }}
                    className="mt-3 text-sm font-bold text-[#188D44] underline cursor-pointer"
                  >
                    View your order status
                  </button>

                  {confirmedTokens.length > 0 && (
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
                            <span>{copiedToken === tok.tokenNumber ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('CART');
                      clearCart();
                    }}
                    className="mt-6 px-8 py-3.5 rounded-[10px] bg-[#49E619] text-[#080808] text-sm font-bold hover:bg-[#B9FF2C] transition-colors cursor-pointer"
                  >
                    ORDER ANOTHER MEAL BOX
                  </button>
                </div>
              ) : cart.length === 0 ? (
                /* Empty Cart State */
                <div className="py-12 text-center">
                  <Utensils className="w-8 h-8 text-[#122023]/40 mx-auto mb-3 stroke-[1.5]" />
                  <p className="font-display-sans uppercase text-xl font-black text-[#122023]">
                    Your meal box is empty
                  </p>
                  <p className="text-xs text-[#122023]/70 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Add any ₹150 meal box from the menu to nourish yourself and sponsor a linked hot meal for a child.
                  </p>
                  {backendMeals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(backendMeals[0]);
                        onClose();
                      }}
                      className="mt-5 px-5 py-3 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      + Quick Add {backendMeals[0].name} (₹{backendMeals[0].priceInr})
                    </button>
                  )}
                </div>
              ) : (
                /* Cart Items */
                <>
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
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
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
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
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

                  {/* Breakdown */}
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

                  {/* Total */}
                  <div className="py-4 flex items-center justify-between">
                    <span className="font-mono-tabular text-sm font-bold uppercase tracking-widest text-[#122023]">
                      TOTAL
                    </span>
                    <span className="font-mono-tabular text-2xl font-bold text-[#122023]">
                      ₹{cartTotalInr}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="rounded-[10px] bg-[#122023] text-white p-3.5 text-xs leading-relaxed flex items-start gap-2.5">
                    <Heart className="w-4 h-4 text-[#49E619] fill-[#49E619] shrink-0 mt-0.5" />
                    <p>"Your purchase helps us provide a nutritious meal to a child in need."</p>
                  </div>

                  {/* Checkout Button or Form */}
                  {checkoutStep === 'CART' ? (
                    <>
                      {formError && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{formError}</p>}
                      <button
                        type="button"
                        onClick={() => void handleProceedToCheckout()}
                        disabled={authLoading || checkoutLoading}
                        className="mt-5 w-full py-4 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#3cd110] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-50"
                      >
                        <span>{checkoutLoading ? 'LOADING ADDRESSES…' : `PROCEED TO ₹${cartTotalInr} CHECKOUT`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleCompletePayment} className="mt-5 pt-5 border-t border-[#122023]/15 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#122023]">
                          DELIVERY & PAYMENT DETAILS
                        </span>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('CART')}
                          className="text-[11px] font-mono-tabular text-[#122023]/70 hover:text-[#122023] cursor-pointer"
                        >
                          ← Back
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono-tabular uppercase text-[#122023]/70 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full rounded-[8px] bg-white border border-[#122023]/20 px-3 py-2 text-xs text-[#122023] focus:outline-none focus:border-[#122023]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono-tabular uppercase text-[#122023]/70 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full rounded-[8px] bg-white border border-[#122023]/20 px-3 py-2 text-xs text-[#122023] focus:outline-none focus:border-[#122023]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono-tabular uppercase text-[#122023]/70 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full rounded-[8px] bg-white border border-[#122023]/20 px-3 py-2 text-xs text-[#122023] focus:outline-none focus:border-[#122023]"
                          required
                        />
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
                        onAddNew={beginAddingAddress}
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
                        <>
                          <button
                            type="button"
                            onClick={() => void saveEditedAddress()}
                            disabled={addressActionLoading || submitting}
                            className="w-full rounded-[8px] border border-[#122023]/20 bg-white px-4 py-3 text-xs font-bold text-[#122023] hover:border-[#188D44] disabled:opacity-50"
                          >
                            {addressActionLoading ? 'Saving address…' : 'Save address changes'}
                          </button>
                          <p className="text-xs text-[#122023]/65">
                            Save the address changes or select another saved address before placing your order.
                          </p>
                        </>
                      )}

                      <div>
                        <label className="mb-1 block text-[11px] font-mono-tabular uppercase text-[#122023]/70">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['UPI', 'CARD', 'NET_BANKING'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`rounded-[6px] border py-2 text-[11px] font-mono-tabular font-bold ${
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

                      {formError && <p role="alert" className="text-xs font-semibold text-red-600">{formError}</p>}

                      <button
                        type="submit"
                        disabled={submitting || addressActionLoading || Boolean(editingAddressId) || !deliveryLocation}
                        className="w-full py-4 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#3cd110] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : `PLACE ORDER ₹${cartTotalInr}`}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
