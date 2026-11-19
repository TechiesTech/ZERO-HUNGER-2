import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import {
  cancelOrder,
  getCheckoutDetails,
  getMyOrders,
  trackMyOrders,
  trackOrder,
  updateDeliveryDetails,
  type DeliveryAddress,
  type DeliveryPoint,
  type Order,
} from '../services/orderService';
import AddressSection from '../components/AddressSection';
import { createAddress, type SavedAddress } from '../services/addressService';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderNumbers, setOrderNumbers] = useState(searchParams.get('orderNumber') || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryPoint | null>(null);
  const [phone, setPhone] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadOrderHistory = async (page: number) => {
    if (!user || !user.roles.includes('customer')) return;
    setLoading(true);
    setError('');
    try {
      const response = await getMyOrders(page, 10);
      setOrders(response.data.orders.map((summary) => ({
        _id: summary._id,
        orderNumber: summary.orderNumber,
        customerName: user.name,
        customerEmail: user.email || '',
        customerPhone: user.phone || '',
        deliveryAddress: undefined,
        deliveryLocation: undefined,
        items: [],
        totalAmountInr: summary.totalAmountInr,
        paymentStatus: summary.paymentStatus || 'pending',
        paymentMethod: summary.paymentMethod || '',
        customerMealStatus: summary.customerMealStatus,
        sponsoredMealsCount: summary.sponsoredMealsCount,
        createdAt: summary.createdAt,
        updatedAt: summary.createdAt,
      })));
      setHistoryPagination({
        page: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
        total: response.data.pagination.total,
      });
      setHistoryLoaded(true);
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : 'Could not load your order history.');
    } finally {
      setLoading(false);
    }
  };

  const lookupNumbers = async (orderNumberValue: string) => {
    setError('');
    setSuccess('');
    setSelectedOrder(null);
    const numbers = [...new Set(orderNumberValue.split(/[\s,;]+/).map((value) => value.trim().toUpperCase()).filter(Boolean))];
    if (numbers.length === 0 || numbers.length > 20) {
      setError('Enter between 1 and 20 order numbers.');
      return;
    }
    if (!user) {
      setError('Sign in with your customer account to view and manage your orders.');
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

  const lookup = (event: React.FormEvent) => {
    event.preventDefault();
    void lookupNumbers(orderNumbers);
  };

  React.useEffect(() => {
    const initialOrderNumber = searchParams.get('orderNumber');
    if (initialOrderNumber) {
      setOrderNumbers(initialOrderNumber);
      void lookupNumbers(initialOrderNumber);
    } else {
      void loadOrderHistory(1);
    }
  }, [user?._id]);

  const manageOrder = async (order: Order) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const details = await trackOrder(order.orderNumber, email);
      setSelectedOrder(details);
      const checkout = await getCheckoutDetails();
      const addresses = (checkout.addresses ?? [])
        .filter((saved): saved is typeof saved & { _id: string } => Boolean(saved._id))
        .map((saved) => ({
          _id: saved._id,
          addressLine1: saved.addressLine1 || '',
          addressLine2: saved.addressLine2 || '',
          area: saved.area || '',
          landmark: saved.landmark || '',
          city: saved.city || '',
          state: saved.state || '',
          pincode: saved.pincode || '',
          label: 'home' as const,
          customerName: saved.customerName || checkout.customer.name || details.customerName,
          customerPhone: saved.customerPhone || checkout.customer.phone || '',
          location: saved.location || null,
          isDefault: Boolean(saved.isDefault),
        }));
      setSavedAddresses(addresses);
      const defaultAddress = addresses.find((saved) => saved._id === checkout.defaultAddress?._id)
        || addresses.find((saved) => saved.isDefault)
        || addresses[0];
      setSelectedAddressId(defaultAddress?._id || '');
      setAddress(defaultAddress ? {
        addressLine1: defaultAddress.addressLine1,
        addressLine2: defaultAddress.addressLine2 || '',
        area: defaultAddress.area,
        landmark: defaultAddress.landmark || '',
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
      } : details.deliveryAddress || EMPTY_ADDRESS);
      setDeliveryLocation(isValidPoint(details.deliveryLocation) ? details.deliveryLocation : null);
      setPhone(defaultAddress?.customerPhone || details.customerPhone || '');
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
    setSaving(true);
    try {
      let addressId = selectedAddressId;
      if (!addressId) {
        if (!isValidPoint(deliveryLocation)) {
          throw new Error('Confirm the delivery pin using the map before saving.');
        }
        if (
          !address.addressLine1.trim() ||
          !address.area.trim() ||
          !address.city.trim() ||
          !address.state.trim() ||
          !address.pincode.trim()
        ) {
          throw new Error('Complete the required delivery address fields before saving.');
        }
        if (savedAddresses.length >= 3) {
          throw new Error('You can save up to 3 addresses. Select one of your saved addresses to continue.');
        }
        const createdAddress = await createAddress({
          ...address,
          customerName: selectedOrder.customerName,
          customerPhone: phone.trim(),
          label: 'home',
          isDefault: false,
          location: deliveryLocation,
        });
        setSavedAddresses((previous) => [...previous, createdAddress]);
        addressId = createdAddress._id;
      }
      await updateDeliveryDetails(selectedOrder.orderNumber, addressId);
      setSuccess('Delivery details updated.');
      const updated = await trackOrder(selectedOrder.orderNumber, email);
      setSelectedOrder(updated);
      setDeliveryLocation(isValidPoint(updated.deliveryLocation) ? updated.deliveryLocation : null);
      setOrders((previous) => previous.map((order) => order.orderNumber === updated.orderNumber ? updated : order));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update delivery details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder?.canCancel || !window.confirm(`Cancel order ${selectedOrder.orderNumber}?`)) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await cancelOrder(selectedOrder.orderNumber);
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
          <p className="mt-2 text-sm text-[#122023]/65">Sign in as a customer to find and manage your orders by order number.</p>
        </header>

        <form onSubmit={lookup} className="space-y-4 rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold">
            Checkout email (optional)
            <input
              type="email"
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
            <h2 className="text-lg font-bold">{orderNumbers.trim() ? 'Matching orders' : 'Your orders'}</h2>
            {orders.map((order) => (
              <article key={order._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#122023]/10 bg-white p-5">
                <div>
                  <p className="font-mono font-bold text-[#188D44]">{order.orderNumber}</p>
                  <p className="mt-1 text-sm">{order.customerMealStatus} · ₹{order.totalAmountInr} · payment {order.paymentStatus}</p>
                  <p className="mt-1 text-xs text-[#122023]/50">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/live-tracking/${encodeURIComponent(order.orderNumber)}`} className="rounded-lg border border-[#188D44]/30 px-4 py-2 text-sm font-semibold text-[#188D44]">
                    Live tracking
                  </Link>
                  <button onClick={() => manageOrder(order)} disabled={loading} className="rounded-lg border border-[#122023]/20 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                    Manage order
                  </button>
                </div>
              </article>
            ))}
            {!orderNumbers.trim() && historyPagination.totalPages > 1 && (
              <div className="flex items-center justify-between py-2 text-sm text-[#122023]/55">
                <span>{historyPagination.total} orders · Page {historyPagination.page} of {historyPagination.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => void loadOrderHistory(historyPagination.page - 1)} disabled={historyPagination.page <= 1 || loading} className="rounded-lg border border-[#122023]/20 px-3 py-1.5 disabled:opacity-40">Previous</button>
                  <button onClick={() => void loadOrderHistory(historyPagination.page + 1)} disabled={historyPagination.page >= historyPagination.totalPages || loading} className="rounded-lg border border-[#122023]/20 px-3 py-1.5 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </section>
        )}
        {!orderNumbers.trim() && historyLoaded && !loading && orders.length === 0 && (
          <p className="rounded-xl border border-[#122023]/10 bg-white p-5 text-sm text-[#122023]/60">You have no orders yet.</p>
        )}

        {selectedOrder && (
          <section className="rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
                <p className="mt-1 text-sm text-[#122023]/65">Status: {selectedOrder.customerMealStatus} · Payment: {selectedOrder.paymentStatus}</p>
              </div>
              {selectedOrder.canCancel && (
                <button onClick={handleCancel} disabled={saving} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
                  Cancel order
                </button>
              )}
            </div>

            {selectedOrder.canEditDetails && isEditable(selectedOrder) ? (
              <form onSubmit={saveDeliveryDetails} className="space-y-3">
                <h3 className="font-semibold">Edit delivery details</h3>
                {savedAddresses.length > 0 && (
                  <label className="block text-sm">Use a saved delivery address
                    <select
                      value={selectedAddressId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setSelectedAddressId(nextId);
                        const saved = savedAddresses.find((item) => item._id === nextId);
                        if (!saved) return;
                        setAddress({
                          addressLine1: saved.addressLine1,
                          addressLine2: saved.addressLine2 || '',
                          area: saved.area,
                          landmark: saved.landmark || '',
                          city: saved.city,
                          state: saved.state,
                          pincode: saved.pincode,
                        });
                        setDeliveryLocation(isValidPoint(saved.location) ? saved.location : null);
                        setPhone(saved.customerPhone || '');
                      }}
                      className="mt-1 w-full rounded-lg border border-[#122023]/20 px-3 py-2"
                    >
                      {savedAddresses.map((saved) => (
                        <option key={saved._id} value={saved._id}>
                          {[saved.addressLine1, saved.area, saved.city].filter(Boolean).join(', ')}
                        </option>
                      ))}
                      <option value="">Add a new address</option>
                    </select>
                  </label>
                )}
                <label className="block text-sm">Phone
                  <input
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setSelectedAddressId('');
                    }}
                    className="mt-1 w-full rounded-lg border border-[#122023]/20 px-3 py-2"
                  />
                </label>
                <AddressSection
                  value={{ address, location: deliveryLocation }}
                  onChange={({ address: nextAddress, location }) => {
                    setAddress(nextAddress);
                    setDeliveryLocation(location);
                    setSelectedAddressId('');
                  }}
                />
                <button disabled={saving || (!selectedAddressId && !isValidPoint(deliveryLocation))} className="rounded-lg bg-[#188D44] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
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
