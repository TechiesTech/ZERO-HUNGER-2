import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Bike, CheckCircle2, Clock3, MapPin, Phone, Power, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  acceptRiderOrder,
  getAvailableOrders,
  getCurrentDelivery,
  getRiderHistory,
  getRiderProfile,
  setRiderAvailability,
  updateRiderDeliveryStatus,
  updateRiderLocation,
  type CurrentRiderDelivery,
  type RiderOrder,
  type RiderProfile,
} from '../services/riderService';
import { formatAddressText } from '../services/trackingService';

function currentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) return Promise.reject(new Error('GPS is not supported on this device.'));
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    return Promise.reject(new Error('Location sharing requires HTTPS.'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Could not access your location. Check location permission and try again.')), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

function googleMapsLink(point?: { latitude: number; longitude: number } | null): string {
  if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
}

function addressLines(address: CurrentRiderDelivery['deliveryAddress']): string {
  return formatAddressText(address) || 'Delivery address unavailable';
}

export function RiderDashboard(): React.ReactElement {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [availableOrders, setAvailableOrders] = useState<RiderOrder[]>([]);
  const [delivery, setDelivery] = useState<CurrentRiderDelivery | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getRiderHistory>> | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locationRequestInFlight = useRef(false);
  const isRider = Boolean(user?.roles.includes('rider'));

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [nextProfile, nextOrders, nextHistory] = await Promise.all([
        getRiderProfile(),
        getAvailableOrders(),
        getRiderHistory(),
      ]);
      setProfile(nextProfile);
      setAvailableOrders(nextOrders);
      setHistory(nextHistory);
      try {
        setDelivery(await getCurrentDelivery());
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 404) setDelivery(null);
        else throw requestError;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load rider information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isRider) void refresh();
  }, [authLoading, isRider, refresh]);

  useEffect(() => {
    if (!isRider) return;
    const timer = window.setInterval(() => {
      void getAvailableOrders()
        .then(setAvailableOrders)
        .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Could not refresh available orders.'));
    }, 30000);
    return () => window.clearInterval(timer);
  }, [isRider]);

  useEffect(() => {
    if (!profile?.isAvailable || !isRider) return;
    const intervalMs = delivery ? 5000 : 25000;
    const timer = window.setInterval(async () => {
      if (locationRequestInFlight.current) return;
      locationRequestInFlight.current = true;
      try {
        const position = await currentPosition();
        await updateRiderLocation(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          position.coords.heading,
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not update rider location.');
      } finally {
        locationRequestInFlight.current = false;
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [delivery, isRider, profile?.isAvailable]);

  const handleAvailability = async () => {
    if (!profile) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      if (profile.isAvailable) {
        await setRiderAvailability(false);
        setProfile({ ...profile, isAvailable: false });
        setNotice('You are now offline.');
      } else {
        const position = await currentPosition();
        await setRiderAvailability(true);
        setProfile({ ...profile, isAvailable: true });
        await updateRiderLocation(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          position.coords.heading,
        );
        setNotice('You are online and sharing your location.');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not change rider availability.');
    } finally {
      setWorking(false);
    }
  };

  const handleAccept = async (order: RiderOrder) => {
    setWorking(true);
    setError('');
    try {
      await acceptRiderOrder(order.orderNumber);
      setNotice(`Order ${order.orderNumber} accepted.`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not accept this order.');
    } finally {
      setWorking(false);
    }
  };

  const handleStatus = async (status: 'pickedup' | 'delivered') => {
    if (!delivery) return;
    if (status === 'delivered' && !selectedPhoto) {
      setError('Upload a delivery photo before marking this order delivered.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      await updateRiderDeliveryStatus(delivery.orderNumber, status, selectedPhoto || undefined);
      setSelectedPhoto(null);
      setNotice(status === 'pickedup' ? 'Pickup confirmed. The customer is now tracking your delivery.' : 'Delivery completed.');
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update delivery status.');
    } finally {
      setWorking(false);
    }
  };

  if (authLoading || loading) {
    return <main className="min-h-[70vh] grid place-items-center text-sm text-[#122023]/60">Loading rider dashboard…</main>;
  }

  if (!user) {
    return (
      <main className="min-h-[70vh] grid place-items-center px-5">
        <section className="max-w-lg rounded-2xl border border-[#122023]/10 bg-white p-8 text-center shadow-sm">
          <Bike className="mx-auto text-[#188D44]" size={36} />
          <h1 className="mt-4 text-2xl font-bold">Rider sign-in required</h1>
          <p className="mt-2 text-sm text-[#122023]/60">Sign in with your approved rider account to go online and manage deliveries.</p>
        </section>
      </main>
    );
  }

  if (!isRider) {
    return (
      <main className="min-h-[70vh] grid place-items-center px-5">
        <section className="max-w-lg rounded-2xl border border-[#122023]/10 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Rider access required</h1>
          <p className="mt-2 text-sm text-[#122023]/60">This dashboard is available to approved rider accounts only.</p>
          <Link to="/" className="mt-5 inline-block rounded-lg bg-[#122023] px-4 py-2 text-sm font-bold text-white">Go to home</Link>
        </section>
      </main>
    );
  }

  if (user.status !== 'active') {
    return (
      <main className="min-h-[70vh] grid place-items-center px-5">
        <section className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-2xl font-bold">Rider account pending approval</h1>
          <p className="mt-2 text-sm text-amber-900/70">You can go online after an administrator approves your rider account.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-5 py-10 text-[#122023]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#188D44]">Rider app</p>
            <h1 className="mt-1 text-3xl font-black">Hello, {user.name}</h1>
            <p className="mt-1 text-sm text-[#122023]/60">{profile?.vehicleType} · {profile?.vehicleNumber || 'Vehicle number not set'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void refresh()} disabled={working} className="inline-flex items-center gap-2 rounded-lg border border-[#122023]/15 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => void handleAvailability()} disabled={!profile || working} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${profile?.isAvailable ? 'bg-red-600' : 'bg-[#188D44]'}`}>
              <Power size={15} /> {working ? 'Please wait…' : profile?.isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </header>

        {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
        {notice && <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
        {!profile?.isAvailable && delivery && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">You have an active delivery. The backend will not allow you to go offline until it is complete.</p>}

        {delivery ? (
          <section className="rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#188D44]">Current delivery</p>
                <h2 className="mt-1 text-xl font-bold">{delivery.orderNumber}</h2>
                <p className="mt-1 text-sm text-[#122023]/60">{delivery.customerMealStatus} · ₹{delivery.totalAmountInr}</p>
              </div>
              <span className="rounded-full bg-[#188D44]/10 px-3 py-1 text-xs font-bold uppercase text-[#188D44]">{delivery.status}</span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl bg-[#f5f7f6] p-4">
                <h3 className="font-bold">Kitchen · {delivery.kitchen?.name || 'Kitchen'}</h3>
                <p className="mt-1 text-sm text-[#122023]/65">{formatAddressText(delivery.kitchen?.address) || 'Kitchen address unavailable'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {delivery.kitchen?.phone && <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 bg-white px-3 py-2 text-xs font-bold" href={`tel:${delivery.kitchen.phone}`}><Phone size={13} /> Call kitchen</a>}
                  <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 bg-white px-3 py-2 text-xs font-bold" href={googleMapsLink(delivery.kitchen?.location)} target="_blank" rel="noreferrer"><MapPin size={13} /> Open in Maps</a>
                </div>
              </article>
              <article className="rounded-xl bg-[#f5f7f6] p-4">
                <h3 className="font-bold">Customer · {delivery.customerName}</h3>
                <p className="mt-1 text-sm text-[#122023]/65">{addressLines(delivery.deliveryAddress)}</p>
                {delivery.deliveryAddress.landmark && <p className="mt-1 text-xs text-[#122023]/50">Landmark: {delivery.deliveryAddress.landmark}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {delivery.customerPhone && <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 bg-white px-3 py-2 text-xs font-bold" href={`tel:${delivery.customerPhone}`}><Phone size={13} /> Call customer</a>}
                  <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 bg-white px-3 py-2 text-xs font-bold" href={googleMapsLink(delivery.deliveryAddress.location)} target="_blank" rel="noreferrer"><MapPin size={13} /> Open in Maps</a>
                </div>
              </article>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#122023]/10 pt-4">
              {delivery.customerMealStatus === 'readyforpickup' ? (
                <button onClick={() => void handleStatus('pickedup')} disabled={working} className="rounded-lg bg-[#122023] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {working ? 'Updating…' : 'Picked up'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#122023]/15 px-3 py-2 text-sm font-semibold">
                    <Upload size={15} />
                    {selectedPhoto ? selectedPhoto.name : 'Add delivery photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSelectedPhoto(file);
                      setError(file && file.size > 5 * 1024 * 1024 ? 'Delivery photo must be smaller than 5 MB.' : '');
                    }} />
                  </label>
                  <button onClick={() => void handleStatus('delivered')} disabled={working || !selectedPhoto || selectedPhoto.size > 5 * 1024 * 1024} className="inline-flex items-center gap-2 rounded-lg bg-[#188D44] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                    <CheckCircle2 size={15} /> {working ? 'Updating…' : 'Delivered'}
                  </button>
                </div>
              )}
              {delivery.pickedUpAt && <span className="text-xs text-[#122023]/45">Picked up {new Date(delivery.pickedUpAt).toLocaleString()}</span>}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Available deliveries</h2>
                <p className="mt-1 text-sm text-[#122023]/55">Orders are offered after the kitchen marks them ready for pickup.</p>
              </div>
              <Clock3 size={22} className="text-[#188D44]" />
            </div>
            {!profile?.isAvailable && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Go online to accept an order. Location sharing works while this app is open; background GPS requires a native app wrapper.</p>}
            <div className="mt-4 space-y-3">
              {availableOrders.length === 0 && <p className="rounded-xl bg-[#f5f7f6] p-6 text-center text-sm text-[#122023]/55">No orders are waiting for a rider.</p>}
              {availableOrders.map((order) => (
                <article key={order.orderNumber} className="rounded-xl border border-[#122023]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono font-bold text-[#188D44]">{order.orderNumber}</p>
                      <p className="mt-1 text-sm font-semibold">{order.kitchen?.name || 'Kitchen'} · {order.deliveryArea || 'Delivery area not provided'}</p>
                      <p className="mt-1 text-xs text-[#122023]/55">{formatAddressText(order.kitchen?.address)}</p>
                    </div>
                    <p className="font-bold">₹{order.totalAmountInr}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 px-3 py-2 text-xs font-bold" href={googleMapsLink(order.kitchen?.location)} target="_blank" rel="noreferrer"><MapPin size={13} /> Kitchen</a>
                    <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 px-3 py-2 text-xs font-bold" href={googleMapsLink(order.deliveryLocation)} target="_blank" rel="noreferrer"><MapPin size={13} /> Customer area</a>
                    {order.kitchen?.phone && <a className="inline-flex items-center gap-1 rounded-lg border border-[#122023]/15 px-3 py-2 text-xs font-bold" href={`tel:${order.kitchen.phone}`}><Phone size={13} /> Call kitchen</a>}
                    <button onClick={() => void handleAccept(order)} disabled={working || !profile?.isAvailable || Boolean(delivery)} className="ml-auto rounded-lg bg-[#188D44] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                      {working ? 'Please wait…' : 'Accept order'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#122023]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent deliveries</h2>
            <span className="text-sm text-[#122023]/50">{history?.totalDeliveries ?? 0} this month</span>
          </div>
          <div className="mt-4 divide-y divide-[#122023]/10">
            {history?.deliveries.map((item) => (
              <div key={`${item.orderNumber}-${item.deliveredAt}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{item.orderNumber} · {item.area || 'Area unavailable'}</p>
                  <p className="text-xs text-[#122023]/50">{new Date(item.deliveredAt).toLocaleString()}</p>
                </div>
                {item.photoUrl && <a href={item.photoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#188D44] underline">Delivery photo</a>}
              </div>
            ))}
            {!history?.deliveries.length && <p className="py-4 text-sm text-[#122023]/50">No completed deliveries this month.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
