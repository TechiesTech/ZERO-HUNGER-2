import React from 'react';
import type { DeliveryAddress, Order } from '../../services/orderService';

interface OrderLookupResultsProps {
  searchPerformed: boolean;
  orderError: string;
  orderSuccess: string;
  orders: Order[];
  selectedOrder: Order | null;
  address: DeliveryAddress;
  setAddress: React.Dispatch<React.SetStateAction<DeliveryAddress>>;
  phone: string;
  setPhone: (value: string) => void;
  saving: boolean;
  loading: boolean;
  onManageOrder: (order: Order) => void;
  onSaveDelivery: (event: React.FormEvent) => void;
  onCancelOrder: () => void;
}

export const OrderLookupResults: React.FC<OrderLookupResultsProps> = ({
  searchPerformed,
  orderError,
  orderSuccess,
  orders,
  selectedOrder,
  address,
  setAddress,
  phone,
  setPhone,
  saving,
  loading,
  onManageOrder,
  onSaveDelivery,
  onCancelOrder,
}) => (
  <div className="mx-auto max-w-4xl space-y-6">
    {!searchPerformed && !orderError && (
      <div className="mx-auto max-w-lg rounded-[18px] border border-white/15 bg-[#080808] p-8 text-center">
        <p className="font-display-sans text-xl font-black uppercase text-white">Track your meal</p>
        <p className="mt-2 text-sm text-white/70">
          Enter your order number and checkout email to view verified tracking details.
        </p>
      </div>
    )}
    {orderError && !orderError.toLowerCase().includes('not found') && (
      <div role="alert" className="rounded-[14px] border border-red-400/40 bg-red-950/40 p-5 text-sm text-red-100">
        <p className="font-mono-tabular text-xs font-bold uppercase tracking-widest">Order lookup error</p>
        <p className="mt-2 text-white/75">{orderError}</p>
      </div>
    )}
    {orderSuccess && (
      <p role="status" className="rounded-[14px] border border-[#49E619]/40 bg-[#49E619]/10 p-4 text-sm text-[#B9FF2C]">
        {orderSuccess}
      </p>
    )}
    {searchPerformed && (orderError.toLowerCase().includes('not found') || (!orderError && orders.length === 0)) && (
      <div role="status" className="mx-auto max-w-lg rounded-[18px] border border-white/15 bg-[#080808] p-12 text-center">
        <p className="font-display-sans text-2xl font-black uppercase text-white">Order not found</p>
        <p className="mt-2 text-sm text-white/70">
          Please verify your order number and checkout email, or place a meal box order to generate a new order number.
        </p>
      </div>
    )}
    {orders.length > 0 && (
      <section className="space-y-3">
        <h2 className="font-display-sans text-xl font-black uppercase text-white">Matching orders</h2>
        {orders.map((order) => (
          <article key={order._id} className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-white/10 bg-[#080808] p-5">
            <div>
              <p className="font-mono-tabular font-bold text-[#49E619]">{order.orderNumber}</p>
              <p className="mt-1 text-sm text-white/80">
                {order.customerMealStatus} · ₹{order.totalAmountInr} · payment {order.paymentStatus}
              </p>
              <p className="mt-1 text-xs text-white/50">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <button
              type="button"
              onClick={() => onManageOrder(order)}
              disabled={loading}
              className="rounded-[9px] border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#49E619] disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Manage order'}
            </button>
          </article>
        ))}
      </section>
    )}

    {selectedOrder && (
      <section className="rounded-[18px] border border-white/10 bg-[#080808] p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <h2 className="font-display-sans text-xl font-black uppercase text-white">{selectedOrder.orderNumber}</h2>
            <p className="mt-1 text-sm text-white/65">
              Status: {selectedOrder.customerMealStatus} · Payment: {selectedOrder.paymentStatus}
            </p>
          </div>
          {selectedOrder.customerMealStatus === 'confirmed' && selectedOrder.paymentStatus !== 'success' && (
            <button
              type="button"
              onClick={onCancelOrder}
              disabled={saving}
              className="rounded-[9px] border border-red-400/50 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50"
            >
              {saving ? 'Please wait…' : 'Cancel order'}
            </button>
          )}
        </div>
        {selectedOrder.customerMealStatus === 'confirmed' || selectedOrder.customerMealStatus === 'preparing' ? (
          <form onSubmit={onSaveDelivery} className="space-y-4">
            <h3 className="font-mono-tabular text-xs font-bold uppercase tracking-widest text-[#49E619]">Edit delivery details</h3>
            <label className="block text-sm text-white/80">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-[9px] border border-white/20 bg-[#122023] px-3 py-2.5 text-white focus:border-[#49E619] focus:outline-none"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['addressLine1', 'Address line 1', true],
                ['addressLine2', 'Address line 2', false],
                ['area', 'Area', true],
                ['landmark', 'Landmark', false],
                ['city', 'City', true],
                ['state', 'State', true],
                ['pincode', 'PIN code', true],
              ] as const).map(([field, label, required]) => (
                <label key={field} className={`block text-sm text-white/80 ${field === 'addressLine1' ? 'sm:col-span-2' : ''}`}>
                  {label}
                  <input
                    required={required}
                    inputMode={field === 'pincode' ? 'numeric' : undefined}
                    pattern={field === 'pincode' ? '[1-9][0-9]{5}' : undefined}
                    maxLength={field === 'pincode' ? 6 : undefined}
                    value={address[field] || ''}
                    onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
                    className="mt-1 w-full rounded-[9px] border border-white/20 bg-[#122023] px-3 py-2.5 text-white focus:border-[#49E619] focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[9px] bg-[#49E619] px-5 py-3 text-sm font-bold text-[#080808] hover:bg-[#B9FF2C] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save delivery details'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-white/60">Delivery details can no longer be changed for this order.</p>
        )}
      </section>
    )}
  </div>
);
