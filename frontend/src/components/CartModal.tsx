import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Heart, ArrowRight, Utensils, CheckCircle2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMealProgram } from '../context/MealProgramContext';
import { useMeals } from '../hooks';
import { getActiveKitchens, type Kitchen } from '../services/kitchenService';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
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
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const { meals: backendMeals, loading: mealsLoading } = useMeals(selectedKitchenId || null);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'CHECKOUT' | 'CONFIRMED'>('CART');
  const [submitting, setSubmitting] = useState(false);
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

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { order, tokens } = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        paymentMethod,
      });
      setConfirmedOrder(order);
      setConfirmedTokens(tokens || []);
      setCheckoutStep('CONFIRMED');
    } catch (error: unknown) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
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
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('CHECKOUT')}
                      className="mt-5 w-full py-4 px-5 rounded-[10px] bg-[#49E619] hover:bg-[#3cd110] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>PROCEED TO ₹{cartTotalInr} CHECKOUT</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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

                      <div>
                        <label className="block text-[11px] font-mono-tabular uppercase text-[#122023]/70 mb-1">
                          Delivery Address
                        </label>
                        <textarea
                          value={Object.values(deliveryAddress).filter(Boolean).join(', ')}
                          onChange={(e) => {
                            const addr = e.target.value;
                            setDeliveryAddress({
                              addressLine1: addr,
                              addressLine2: '',
                              area: '',
                              landmark: '',
                              city: '',
                              state: '',
                              pincode: '',
                            });
                          }}
                          className="w-full rounded-[8px] bg-white border border-[#122023]/20 px-3 py-2 text-xs text-[#122023] focus:outline-none focus:border-[#122023] resize-none"
                          rows={2}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
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
