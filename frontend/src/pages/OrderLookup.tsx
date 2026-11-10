import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import {
  cancelOrder,
  trackMyOrders,
  trackOrder,
  updateDeliveryDetails,
  type DeliveryAddress,
  type DeliveryPoint,
  type Order,
} from '../services/orderService';
import AddressSection from '../components/AddressSection';

const EMPTY_ADDRESS: DeliveryAddress = {
  addressLine1: '',
  addressLine2: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

const isValidPoint = (point?: DeliveryPoint | null): point is DeliveryPoint =>
  point !== undefined &&
  point !== null &&
  Number.isFinite(point.latitude) &&
  point.latitude >= -90 &&
  point.latitude <= 90 &&
  Number.isFinite(point.longitude) &&
  point.longitude >= -180 &&
  point.longitude <= 180;

function isEditable(order: Order) {
  return order.customerMealStatus === 'confirmed' || order.customerMealStatus === 'preparing';
}

export function OrderLookup(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderNumbers, setOrderNumbers] = useState(searchParams.get('orderNumber') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPoint | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSelectedOrder(null);
    const numbers = [...new Set(orderNumbers.split(/[\s,;]+/).map((value) => value.trim().toUpperCase()).filter(Boolean))];
    if (!email.trim() || numbers.length === 0 || numbers.length > 20) {
      setError('Enter your email and between 1 and 20 order numbers.');
      return;
    }

    setLoading(true);
    try {
      if (numbers.length === 1) {
        const order = await trackOrder(numbers[0], email);
        setOrders([order]);
      } else {
        const response = await trackMyOrders(numbers.map((orderNumber) => ({ orderNumber, customerEmail: email })));
        setOrders(response.data);
      }
    } catch (lookupError) {
      setOrders([]);
      setError(lookupError instanceof Error ? lookupError.message : 'Could not find these orders.');
    } finally {
      setLoading(false);
    }
  };

  const manageOrder = async (order: Order) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const details = await trackOrder(order.orderNumber, email);
      setSelectedOrder(details);
      setAddress(details.deliveryAddress || EMPTY_ADDRESS);
      setDeliveryLocation(isValidPoint(details.deliveryLocation) ? details.deliveryLocation : null);
      setPhone(details.customerPhone || '');
    } catch (detailsError) {
      setError(detailsError instanceof Error ? detailsError.message : 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  };

  const saveDeliveryDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setError('');
    setSuccess('');
    if (!isValidPoint(deliveryLocation)) {
      setError('Confirm the delivery pin using address search or the map before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateDeliveryDetails(selectedOrder.orderNumber, email, {
        customerPhone: phone,
        deliveryAddress: address,
        deliveryLocation,
      });
      setSuccess('Delivery details updated.');
      const updated = await trackOrder(selectedOrder.orderNumber, email);
      setSelectedOrder(updated);
      setAddress(updated.deliveryAddress || EMPTY_ADDRESS);
      setDeliveryLocation(isValidPoint(updated.deliveryLocation) ? updated.deliveryLocation : null);
      setPhone(updated.customerPhone || '');
      setOrders((previous) => previous.map((order) => order.orderNumber === updated.orderNumber ? updated : order));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update delivery details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder || !window.confirm(`Cancel order ${selectedOrder.orderNumber}?`)) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await cancelOrder(selectedOrder.orderNumber, email);
      const updated = await trackOrder(selectedOrder.orderNumber, email);
      setSelectedOrder(updated);
      setOrders((previous) => previous.map((order) => order.orderNumber === updated.orderNumber ? updated : order));
      setSuccess('Order cancelled.');
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel this order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-5 py-16 text-[#122023]">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#188D44]">Order support</p>
          <h1 className="mt-2 text-3xl font-black">Find and manage your order</h1>
          <p className="mt-2 text-sm text-[#122023]/65">Use the email address from checkout and one or more order numbers.</p>
        </header>

        <form onSubmit={lookup} className="space-y-4 rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold">
            Checkout email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#122023]/20 px-3 py-2.5 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            Order number(s)
            <textarea
              required
              rows={3}
              value={orderNumbers}
              onChange={(event) => setOrderNumbers(event.target.value)}
              placeholder="ZH-ORD-ABC123"
              className="mt-1.5 w-full rounded-lg border border-[#122023]/20 px-3 py-2.5 font-mono font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-[#122023]/50">Separate multiple order numbers with commas or new lines (up to 20).</span>
          </label>
          <button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#122023] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Find order
          </button>
        </form>

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
        {success && <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">{success}</p>}

        {orders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Matching orders</h2>
            {orders.map((order) => (
              <article key={order._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#122023]/10 bg-white p-5">
                <div>
                  <p className="font-mono font-bold text-[#188D44]">{order.orderNumber}</p>
                  <p className="mt-1 text-sm">{order.customerMealStatus} · ₹{order.totalAmountInr} · payment {order.paymentStatus}</p>
                  <p className="mt-1 text-xs text-[#122023]/50">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => manageOrder(order)} disabled={loading} className="rounded-lg border border-[#122023]/20 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                  Manage order
                </button>
              </article>
            ))}
          </section>
        )}

        {selectedOrder && (
          <section className="rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
                <p className="mt-1 text-sm text-[#122023]/65">Status: {selectedOrder.customerMealStatus} · Payment: {selectedOrder.paymentStatus}</p>
              </div>
              {selectedOrder.customerMealStatus === 'confirmed' && selectedOrder.paymentStatus !== 'success' && (
                <button onClick={handleCancel} disabled={saving} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
                  Cancel order
                </button>
              )}
            </div>

            {isEditable(selectedOrder) ? (
              <form onSubmit={saveDeliveryDetails} className="space-y-3">
                <h3 className="font-semibold">Edit delivery details</h3>
                <label className="block text-sm">Phone
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-[#122023]/20 px-3 py-2" />
                </label>
                <AddressSection
                  value={{ address, location: deliveryLocation }}
                  onChange={({ address: nextAddress, location }) => {
                    setAddress(nextAddress);
                    setDeliveryLocation(location);
                  }}
                />
                <button disabled={saving || !isValidPoint(deliveryLocation)} className="rounded-lg bg-[#188D44] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save delivery details'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-[#122023]/60">Delivery details can no longer be changed for this order.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
