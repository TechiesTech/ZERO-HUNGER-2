import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Send,
  Upload,
} from 'lucide-react';
import {
  BENEFICIARIES,
  CONSENTED_DELIVERY_PHOTOS,
  type CharityToken,
} from '../data/mealProgram';
import {
  cancelOrder,
  trackMyOrders,
  trackOrder,
  updateDeliveryDetails,
  type DeliveryAddress,
  type Order,
} from '../services/orderService';
import { trackLiveOrder, type TrackingData } from '../services/trackingService';
import { useMealProgram } from '../context/MealProgramContext';
import { EditorialImage } from '../components/EditorialImage';
import { DeliveryRouteMap } from '../components/DeliveryRouteMap';
import { OrderLookupResults } from '../components/trackMeal/OrderLookupResults';
import { TrackMealHeader } from '../components/trackMeal/TrackMealHeader';
import {
  EMPTY_ADDRESS,
  ORDER_STATUS_CONTENT,
  ORDER_STATUS_STEPS,
  createOrderFromLiveTracking,
  createTrackingToken,
  formatTrackingDate,
  formatTrackingTimestamp,
  getOrderTrackingStatus,
  type OrderTrackingStatus,
} from './trackMeal/trackMealUtils';

export const TrackMeal: React.FC = () => {
  const {
    markTokenDelivered,
    uploadDeliveryPhoto,
    sendCustomerNotification,
  } = useMealProgram();

  const [lookupMode, setLookupMode] = useState<'order' | 'tracking'>('order');
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [liveTracking, setLiveTracking] = useState<TrackingData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [phone, setPhone] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'CUSTOMER_TRACKER' | 'ADMIN_DASHBOARD'>(
    'CUSTOMER_TRACKER'
  );

  // Admin Dashboard customization state
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('ZH-10482');
  const [selectedLocation, setSelectedLocation] = useState('LOCATION NOT PROVIDED');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(
    CONSENTED_DELIVERY_PHOTOS[0].url
  );
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  const trackedOrder = useMemo(
    () => liveTracking ? createOrderFromLiveTracking(liveTracking, email) : null,
    [liveTracking, email],
  );
  const activeToken: CharityToken | undefined = useMemo(
    () => trackedOrder ? createTrackingToken(trackedOrder) : undefined,
    [trackedOrder],
  );
  const trackingStatus = trackedOrder
    ? getOrderTrackingStatus(trackedOrder.customerMealStatus)
    : undefined;
  const sponsoredMealsCount = trackedOrder?.sponsoredMealsCount ?? 1;
  const liveDestinationLabel = liveTracking?.destination &&
    typeof liveTracking.destination.latitude === 'number' &&
    typeof liveTracking.destination.longitude === 'number'
    ? `${liveTracking.destination.latitude.toFixed(5)}, ${liveTracking.destination.longitude.toFixed(5)}`
    : 'Not provided by tracking API';
  const isCancelled = trackingStatus === 'cancelled';
  const statusContent = trackingStatus ? ORDER_STATUS_CONTENT[trackingStatus] : undefined;
  const statusLabel = ORDER_STATUS_STEPS.find(({ status }) => status === trackingStatus)?.label
    || activeToken?.status.replace(/_/g, ' ')
    || '';

  useEffect(() => {
    if (activeToken) {
      setSelectedBeneficiary(activeToken.beneficiaryId || 'ZH-10482');
      setSelectedLocation(activeToken.deliveryLocation || 'LOCATION NOT PROVIDED');
      if (activeToken.deliveryPhoto) {
        setSelectedPhotoUrl(activeToken.deliveryPhoto);
      }
    }
  }, [activeToken]);

  const clearTrackingResult = () => {
    setLiveTracking(null);
    setOrders([]);
    setSelectedOrder(null);
    setOrderError('');
    setOrderSuccess('');
    setSearchPerformed(false);
    setLookupMode('order');
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearTrackingResult();
    const identifiers = [...new Set(orderNumberInput.split(/[\s,;]+/).map((value) => value.trim().toUpperCase()).filter(Boolean))];
    if (identifiers.length === 0) return;

    setSearchPerformed(true);
    if (!email.trim() || identifiers.length > 20) {
      setOrderError(!email.trim()
        ? 'Enter the checkout email used for this meal.'
        : 'Enter no more than 20 order numbers.');
      return;
    }

    setLoading(true);
    try {
      if (identifiers.length === 1) {
        const response = await trackLiveOrder(identifiers[0], email);
        console.log('[TrackMeal] trackLiveOrder response:', response.data);
        console.log('[TrackMeal] kitchen details:', response.data.kitchen);
        setLiveTracking(response.data);
        setViewMode('CUSTOMER_TRACKER');
        setLookupMode('tracking');
      } else {
        const response = await trackMyOrders(identifiers.map((orderNumber) => ({ orderNumber, customerEmail: email })));
        console.log('[TrackMeal] trackMyOrders response:', response.data);
        setOrders(response.data);
      }
    } catch (lookupError) {
      console.log('[TrackMeal] lookup error:', lookupError);
      setOrderError(lookupError instanceof Error ? lookupError.message : 'Could not find these orders.');
    } finally {
      setLoading(false);
    }
  };

  const manageOrder = async (order: Order) => {
    setOrderError('');
    setOrderSuccess('');
    setLoading(true);
    try {
      const details = await trackOrder(order.orderNumber, email);
      console.log('[TrackMeal] trackOrder (manage) response:', details);
      setSelectedOrder(details);
      setAddress(details.deliveryAddress || EMPTY_ADDRESS);
      setPhone(details.customerPhone || '');
    } catch (detailsError) {
      setOrderError(detailsError instanceof Error ? detailsError.message : 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  };

  const saveDeliveryDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setOrderError('');
    setOrderSuccess('');
    setSaving(true);
    try {
      const updateResponse = await updateDeliveryDetails(selectedOrder.orderNumber, email, {
        customerPhone: phone,
        deliveryAddress: address,
      });
      console.log('[TrackMeal] updateDeliveryDetails response:', updateResponse);
      setOrderSuccess('Delivery details updated.');
      const updated: Order = {
        ...selectedOrder,
        ...updateResponse.data,
        customerPhone: phone,
        deliveryAddress: updateResponse.data.deliveryAddress || address,
      };
      setSelectedOrder(updated);
      setAddress(updated.deliveryAddress || EMPTY_ADDRESS);
      setPhone(updated.customerPhone || '');
      setOrders((previous) => previous.map((order) => order.orderNumber === updated.orderNumber ? updated : order));
    } catch (saveError) {
      setOrderError(saveError instanceof Error ? saveError.message : 'Could not update delivery details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !window.confirm(`Cancel order ${selectedOrder.orderNumber}?`)) return;
    setOrderError('');
    setOrderSuccess('');
    setSaving(true);
    try {
      const cancelResponse = await cancelOrder(selectedOrder.orderNumber, email);
      console.log('[TrackMeal] cancelOrder response:', cancelResponse);
      const updated: Order = { ...selectedOrder, ...cancelResponse.data };
      setSelectedOrder(updated);
      setOrders((previous) => previous.map((order) => order.orderNumber === updated.orderNumber ? updated : order));
      setOrderSuccess('Order cancelled.');
    } catch (cancelError) {
      setOrderError(cancelError instanceof Error ? cancelError.message : 'Could not cancel this order.');
    } finally {
      setSaving(false);
    }
  };

  const isDelivered = trackingStatus === 'delivered';

  const statusOrder: OrderTrackingStatus[] = [
    'confirmed',
    'preparing',
    'readyforpickup',
    'outfordelivery',
    'delivered',
  ];
  const currentStatusIndex = trackingStatus ? statusOrder.indexOf(trackingStatus) : -1;
  const timelineSteps = (isCancelled
    ? ORDER_STATUS_STEPS.filter(({ status }) => status === 'confirmed' || status === 'cancelled')
    : ORDER_STATUS_STEPS.filter(({ status }) => status !== 'cancelled')
  ).map((step) => {
    const stepIndex = statusOrder.indexOf(step.status);
    const liveTimestamp = liveTracking?.timeline.find(({ status }) => status === step.status)?.at;
    const timestamp = liveTracking
      ? liveTimestamp
      : step.timestampKey === 'createdAt'
        ? trackedOrder?.createdAt
        : trackedOrder?.statusTimestamps?.[step.timestampKey];
    const completed = step.status === 'confirmed'
      ? Boolean(liveTimestamp || !liveTracking)
      : step.status === 'cancelled'
        ? isCancelled
        : liveTimestamp !== undefined && liveTracking
          ? liveTimestamp !== null || step.status === trackingStatus
          : stepIndex <= currentStatusIndex;

    return {
      ...step,
      date: (liveTracking ? formatTrackingTimestamp(timestamp) : formatTrackingDate(timestamp))
        || (step.status === trackingStatus ? 'IN PROGRESS' : completed ? 'COMPLETED' : 'AWAITING'),
      completed,
      isCurrent: trackingStatus === step.status,
    };
  });

  return (
    <div className="bg-[#080808] text-white min-h-screen">
      <TrackMealHeader
        orderNumberInput={orderNumberInput}
        setOrderNumberInput={setOrderNumberInput}
        email={email}
        setEmail={setEmail}
        loading={loading}
        onSubmit={handleSearchSubmit}
        clearResult={clearTrackingResult}
      />

      {/* =====================================================================
          MAIN CONTENT AREA
      ====================================================================== */}
      <section className="bg-[#122023] py-16 sm:py-24">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          {lookupMode === 'order' ? (
            <OrderLookupResults
              searchPerformed={searchPerformed}
              orderError={orderError}
              orderSuccess={orderSuccess}
              orders={orders}
              selectedOrder={selectedOrder}
              address={address}
              setAddress={setAddress}
              phone={phone}
              setPhone={setPhone}
              saving={saving}
              loading={loading}
              onManageOrder={manageOrder}
              onSaveDelivery={saveDeliveryDetails}
              onCancelOrder={handleCancelOrder}
            />
          ) : !activeToken && !searchPerformed ? (
            <div className="rounded-[18px] bg-[#080808] border border-white/15 p-8 text-center max-w-lg mx-auto">
              <p className="font-display-sans uppercase text-2xl font-black text-white">
                Track your meal
              </p>
              <p className="text-sm text-white/70 mt-2">
                Enter your order number and checkout email, then select Track Meal to see verified details.
              </p>
            </div>
          ) : !activeToken ? (
            <div className="rounded-[18px] bg-[#080808] border border-white/15 p-12 text-center max-w-lg mx-auto">
              <p className="font-display-sans uppercase text-2xl font-black text-white">
                Order not found
              </p>
              <p className="text-sm text-white/70 mt-2">
                Please verify your order number and checkout email, or place a meal box order to generate a new order number.
              </p>
            </div>
          ) : viewMode === 'CUSTOMER_TRACKER' ? (
            /* ===============================================================
                VIEW 1: CUSTOMER IMPACT TRACKER (TIMELINE + MAP + IMPACT + SAFEGUARDING)
            ================================================================ */
            <div className="space-y-12">
              {/* Dual-Stream Distinction Banner: Customer's Purchased Meal vs Sponsored Child Meal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1: Customer's Own Meal */}
                <div className="rounded-[16px] bg-[#F2F4F3] text-[#122023] p-6 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#188D44] block">
                      ORDER {activeToken.orderId} · YOUR PURCHASED MEAL
                    </span>
                    <h2 className="font-display-sans uppercase text-2xl font-black text-[#122023] mt-1">
                      {activeToken.productName} (For {activeToken.customerName})
                    </h2>
                    <p className="text-xs text-[#122023]/75 mt-1">
                      {trackedOrder ? 'Order total' : 'Paid'}: ₹{activeToken.amountPaidInr}
                      {trackedOrder && ` · Payment ${trackedOrder.paymentStatus}`}
                      {' · '}{statusContent?.description}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-[6px] bg-[#122023] text-[#4EDBE2] font-mono-tabular text-[11px] font-bold uppercase shrink-0">
                    {statusLabel}
                  </span>
                </div>

                {/* Box 2: Linked Sponsored Child Meal */}
                <div className="rounded-[16px] bg-[#49E619] text-[#122023] p-6 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#122023]/80 block">
                      TOKEN {activeToken.tokenNumber} · SPONSORED CHILD MEAL
                    </span>
                    <h2 className="font-display-sans uppercase text-2xl font-black text-[#122023] mt-1">
                      {sponsoredMealsCount} Nutritious Child Meal{sponsoredMealsCount === 1 ? '' : 's'}
                    </h2>
                    <p className="text-xs text-[#122023]/85 font-medium mt-1">
                      {trackedOrder
                        ? `${trackedOrder.sponsoredMealsCount} sponsored meal${trackedOrder.sponsoredMealsCount === 1 ? '' : 's'} funded by this order. `
                        : 'Funded by your purchase · Recipient Beneficiary ID: '}
                      <strong className="font-mono-tabular text-[#122023]">
                        {trackedOrder
                          ? 'Assignment details pending'
                          : activeToken.beneficiaryId}
                      </strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-[6px] bg-[#122023] text-[#B9FF2C] font-mono-tabular text-[11px] font-bold uppercase shrink-0">
                    {trackedOrder ? 'SPONSORED MEAL FUNDED' : isDelivered ? 'CHILD RECEIVED ❤️' : activeToken.status}
                  </span>
                </div>
              </div>

              {isCancelled ? (
                <section className="rounded-[18px] border border-red-300/30 bg-[#080808] p-6 sm:p-8">
                  <span className="inline-flex rounded-[7px] bg-red-300 px-3 py-1 font-mono-tabular text-xs font-bold uppercase text-[#122023]">
                    ORDER CANCELLED
                  </span>
                  <h2 className="mt-4 font-display-sans text-2xl font-black uppercase text-white">
                    {statusContent?.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/70">{statusContent?.description}</p>
                  <p className="mt-4 font-mono-tabular text-xs text-white/55">
                    Order {trackedOrder?.orderNumber || activeToken.orderId}
                    {trackedOrder?.statusTimestamps?.cancelledAt &&
                      ` · ${formatTrackingDate(trackedOrder.statusTimestamps.cancelledAt)}`}
                  </p>
                </section>
              ) : (
                <>
              {/* INTERACTIVE LEAFLET GEOSPATIAL MAP: COMMUNITY KITCHENS & DELIVERY PATHS */}
              <DeliveryRouteMap token={activeToken} liveTracking={liveTracking || undefined} />

              {/* Status-specific order timeline */}
              <section className="rounded-[18px] bg-[#080808] border border-white/12 p-6 sm:p-8 shadow-xl">
                <div className="pb-4 mb-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono-tabular text-xs font-bold uppercase tracking-widest text-white">
                      ORDER STATUS TIMELINE
                    </span>
                    {statusContent && (
                      <p className="mt-2 text-sm text-white/65">{statusContent.description}</p>
                    )}
                  </div>
                  <span className="rounded-[7px] bg-[#49E619] px-3 py-1 font-mono-tabular text-xs font-bold uppercase text-[#080808]">
                    {statusLabel}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {timelineSteps.map((step) => (
                    <article
                      key={step.status}
                      aria-current={step.isCurrent ? 'step' : undefined}
                      className={`rounded-[12px] border p-4 ${
                        step.completed
                          ? `${step.bgClass} border-transparent`
                          : 'bg-white/5 border-white/10 text-white/55'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display-sans text-sm font-black uppercase">
                          {step.label}
                        </span>
                        {step.completed
                          ? <Check className="h-4 w-4 shrink-0" />
                          : <Clock className="h-4 w-4 shrink-0" />}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed opacity-80">{step.description}</p>
                      <p className="mt-3 font-mono-tabular text-[10px] font-bold uppercase opacity-75">
                        {step.date}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
                </>
              )}

              {/* Status-specific impact and delivery details */}
              {!isCancelled && <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* RIGHT 7 COLUMNS: YOUR IMPACT + DELIVERY PHOTO + PRIVACY PROTECTION */}
                <div className="lg:col-span-12 space-y-6">
                  {isDelivered ? (
                    <div className="rounded-[18px] bg-[#080808] border border-white/15 p-6 sm:p-9 shadow-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/12">
                        <div>
                          <span className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#49E619] block">
                            YOUR IMPACT
                          </span>
                          <h3 className="font-display-sans uppercase text-3xl sm:text-4xl font-black text-white mt-1">
                            {trackedOrder ? statusContent?.title : 'Meal delivered successfully ❤️'}
                          </h3>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-[8px] bg-[#49E619] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest">
                          {trackedOrder ? 'ORDER DELIVERED ✓' : 'VERIFIED DELIVERY ✓'}
                        </span>
                      </div>

                      {/* Recipient & Location Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-white/12">
                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#49E619] block">
                            {trackedOrder ? 'SPONSORED MEAL' : 'RECIPIENT (ANONYMIZED)'}
                          </span>
                          <span className="font-mono-tabular text-sm font-bold text-white mt-1 block">
                            {trackedOrder
                              ? 'Assignment is tracked separately'
                              : `Beneficiary ID: ${activeToken.beneficiaryId}`}
                          </span>
                        </div>

                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#4EDBE2] block">
                            {trackedOrder ? 'CUSTOMER DELIVERY AREA' : 'LOCATION'}
                          </span>
                          <span className="text-sm font-bold text-white mt-1 block">
                            {liveTracking ? liveDestinationLabel : activeToken.deliveryLocation}
                          </span>
                        </div>

                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#B9FF2C] block">
                            DELIVERED
                          </span>
                          <span className="font-mono-tabular text-sm font-bold text-white mt-1 block">
                            {(liveTracking
                              ? formatTrackingTimestamp(liveTracking.timeline.find(({ status }) => status === 'delivered')?.at)
                              : formatTrackingDate(trackedOrder?.statusTimestamps?.deliveredAt)) ||
                              activeToken.deliveredAt ||
                              'Delivery confirmed'}
                          </span>
                        </div>
                      </div>

                      {/* Photo of Meal Delivery */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono-tabular text-xs font-bold uppercase tracking-widest text-white inline-flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#49E619]" />
                            <span>PHOTO OF MEAL DELIVERY</span>
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#49E619] font-bold">
                            {trackedOrder ? 'Photo not provided' : 'Safeguarding Consent Verified ✓'}
                          </span>
                        </div>

                        <div className="relative rounded-[14px] aspect-[16/10] overflow-hidden border border-white/15 bg-[#122023]">
                          {activeToken.deliveryPhoto && activeToken.photoUploaded ? (
                            <>
                              <EditorialImage
                                src={activeToken.deliveryPhoto}
                                alt={`Verified meal delivery for token ${activeToken.tokenNumber} at ${activeToken.deliveryLocation}`}
                                className="w-full h-full"
                              />
                              <div className="absolute bottom-3 left-3 right-3 rounded-[8px] bg-[#080808]/90 backdrop-blur-xs text-white px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular">
                                <span>
                                  TOKEN: {activeToken.tokenNumber} · BENEFICIARY:{' '}
                                  {activeToken.beneficiaryId}
                                </span>
                                <span className="text-[#49E619] font-bold">
                                  {activeToken.deliveryLocation.toUpperCase()}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                              <Camera className="h-8 w-8 text-[#49E619]" />
                              <p className="mt-3 font-display-sans text-lg font-black uppercase text-white">
                                Delivery photo not available
                              </p>
                              <p className="mt-2 text-sm text-white/60">
                                The order is delivered, but a verified delivery photo has not been added.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Notification Receipt Card */}
                      {!trackedOrder && <div className="mt-6 rounded-[14px] bg-[#B9FF2C] text-[#122023] p-5">
                        <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-widest text-[#122023]/80 block">
                          CUSTOMER DISPATCH MESSAGE
                        </span>
                        <p className="font-display-sans uppercase text-xl font-black text-[#122023] mt-1">
                          Your meal has reached a child in need ❤️
                        </p>
                        <p className="font-mono-tabular text-xs text-[#122023] mt-1">
                          Token: <strong>{activeToken.tokenNumber}</strong>
                        </p>
                        <p className="text-xs text-[#122023]/80 font-medium mt-1">
                          Thank you for helping provide a nutritious meal through
                          our community distribution program.
                        </p>
                      </div>}
                    </div>
                  ) : (
                    <div className="rounded-[18px] bg-[#080808] border border-white/15 p-6 sm:p-9 shadow-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/12">
                        <div>
                          <span className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#49E619] block">
                            YOUR IMPACT
                          </span>
                          <h3 className="font-display-sans uppercase text-3xl sm:text-4xl font-black text-white mt-1">
                            {statusContent?.title}
                          </h3>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-[8px] bg-[#B9FF2C] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-widest">
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-white/12">
                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#49E619] block">
                            {trackedOrder ? 'SPONSORED MEAL' : 'RECIPIENT (ANONYMIZED)'}
                          </span>
                          <span className="font-mono-tabular text-sm font-bold text-white mt-1 block">
                            {trackedOrder
                              ? 'Assignment details pending'
                              : activeToken.beneficiaryId === 'PENDING ASSIGNMENT'
                              ? 'Assignment pending'
                              : `Beneficiary ID: ${activeToken.beneficiaryId}`}
                          </span>
                        </div>
                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#4EDBE2] block">
                            {trackedOrder ? 'CUSTOMER DELIVERY AREA' : 'LOCATION'}
                          </span>
                          <span className="text-sm font-bold text-white mt-1 block">
                            {liveTracking
                              ? liveDestinationLabel
                              : trackedOrder
                                ? `${trackedOrder.deliveryAddress?.city || ''}${trackedOrder.deliveryAddress?.state ? `, ${trackedOrder.deliveryAddress.state}` : ''}` || 'Address on order'
                                : activeToken.deliveryLocation}
                          </span>
                        </div>
                        <div className="rounded-[10px] bg-[#122023] p-3.5">
                          <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#B9FF2C] block">
                            DELIVERY
                          </span>
                          <span className="font-mono-tabular text-sm font-bold text-white mt-1 block">
                            {trackingStatus === 'outfordelivery'
                              ? 'In transit'
                              : trackingStatus === 'readyforpickup'
                                ? 'Awaiting dispatch'
                                : 'Not dispatched yet'}
                          </span>
                          {liveTracking?.estimatedDeliveryAt && (
                            <span className="mt-1 block text-xs text-white/65">
                              ETA: {formatTrackingTimestamp(liveTracking.estimatedDeliveryAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="font-mono-tabular text-xs font-bold uppercase tracking-widest text-white inline-flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#49E619]" />
                            <span>PHOTO OF MEAL DELIVERY</span>
                          </span>
                          <span className="font-mono-tabular text-[11px] text-white/55 font-bold">
                            Proof pending
                          </span>
                        </div>
                        <div className="rounded-[14px] aspect-[16/10] border border-white/15 bg-[#122023] flex flex-col items-center justify-center px-6 text-center">
                          <Clock className="w-8 h-8 text-[#49E619]" />
                          <p className="mt-3 font-display-sans uppercase text-lg font-black text-white">
                            Delivery proof will appear here
                          </p>
                          <p className="mt-2 text-sm text-white/60">
                            {statusContent?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strict Child Privacy & Safeguarding Policy Box */}
                  <div className="rounded-[18px] bg-[#080808] text-white p-6 sm:p-7 border border-[#49E619]/30">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Lock className="w-4 h-4 text-[#49E619]" />
                      <h4 className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#49E619]">
                        CHILD PRIVACY & SAFEGUARDING PROTECTION
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                      To protect the dignity and safety of every child we serve,
                      Zero Hunger strictly prohibits exposing a child’s{' '}
                      <strong className="text-white">
                        full name, home address, phone number, school details, or
                        personally identifying information
                      </strong>
                      . All impact records use an anonymized{' '}
                      <span className="font-mono-tabular text-[#B9FF2C]">
                        Beneficiary ID ({activeToken.beneficiaryId})
                      </span>{' '}
                      and community-level photography published only when
                      verified guardian consent and safeguarding requirements are
                      met.
                    </p>
                  </div>
                </div>
              </div>}
            </div>
          ) : (
            /* ===============================================================
                VIEW 2: NGO ADMIN DELIVERY CONFIRMATION DASHBOARD
            ================================================================ */
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="rounded-[20px] bg-[#080808] border border-white/20 shadow-2xl p-6 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/12">
                  <div>
                    <span className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#49E619] block">
                      NGO FIELD OPERATIONS
                    </span>
                    <h2 className="font-display-sans uppercase text-3xl sm:text-4xl font-black text-white mt-1">
                      ADMIN DASHBOARD
                    </h2>
                  </div>

                  <span
                    className={`px-4 py-1.5 rounded-[8px] font-mono-tabular text-xs font-bold uppercase tracking-widest ${
                      isDelivered
                        ? 'bg-[#49E619] text-[#080808]'
                        : 'bg-[#B9FF2C] text-[#122023]'
                    }`}
                  >
                    {isDelivered ? 'DELIVERED ✓' : 'READY FOR DELIVERY'}
                  </span>
                </div>

                {/* Exact Requested Admin Record Fields */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-white/12 text-sm">
                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Token:
                    </dt>
                    <dd className="font-mono-tabular text-lg font-bold text-[#49E619] mt-1">
                      {activeToken.tokenNumber}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Customer:
                    </dt>
                    <dd className="text-lg font-bold text-white mt-1">
                      {activeToken.customerName}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Meal:
                    </dt>
                    <dd className="font-display-sans uppercase text-lg font-black text-white mt-1">
                      {activeToken.productName}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Amount:
                    </dt>
                    <dd className="font-mono-tabular text-lg font-bold text-[#B9FF2C] mt-1">
                      ₹{activeToken.amountPaidInr}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Sponsored Meal:
                    </dt>
                    <dd className="font-mono-tabular text-lg font-bold text-[#49E619] mt-1">
                      YES
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60">
                      Status:
                    </dt>
                    <dd className="font-mono-tabular text-lg font-bold text-white mt-1">
                      {isDelivered ? 'DELIVERED ✓' : 'READY FOR DELIVERY'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60 mb-1">
                      Beneficiary (Anonymized ID):
                    </dt>
                    <dd>
                      <select
                        value={selectedBeneficiary}
                        onChange={(e) => {
                          const benCode = e.target.value;
                          setSelectedBeneficiary(benCode);
                          const found = BENEFICIARIES.find(
                            (b) => b.beneficiaryCode === benCode
                          );
                          if (found) {
                            setSelectedLocation(found.communityCenter);
                          }
                        }}
                        className="w-full rounded-[8px] border border-white/20 bg-[#122023] px-3 py-2.5 font-mono-tabular text-xs font-bold text-white"
                      >
                        {BENEFICIARIES.map((b) => (
                          <option key={b.id} value={b.beneficiaryCode}>
                            {b.beneficiaryCode} — {b.ageGroup}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono-tabular text-[11px] uppercase tracking-widest text-white/60 mb-1">
                      Delivery Location:
                    </dt>
                    <dd>
                      <input
                        type="text"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full rounded-[8px] border border-white/20 bg-[#122023] px-3 py-2.5 text-xs font-semibold text-white"
                      />
                    </dd>
                  </div>
                </dl>

                {/* Live Admin Status Checkmarks */}
                <div className="py-5 border-b border-white/12 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-[10px] font-mono-tabular text-xs font-bold flex items-center justify-between ${
                      isDelivered
                        ? 'bg-[#49E619] text-[#080808]'
                        : 'bg-[#122023] text-white/60'
                    }`}
                  >
                    <span>DELIVERED</span>
                    <span>{isDelivered ? '✓' : '—'}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-[10px] font-mono-tabular text-xs font-bold flex items-center justify-between ${
                      activeToken.photoUploaded
                        ? 'bg-[#4EDBE2] text-[#080808]'
                        : 'bg-[#122023] text-white/60'
                    }`}
                  >
                    <span>Photo uploaded</span>
                    <span>{activeToken.photoUploaded ? '✓' : '—'}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-[10px] font-mono-tabular text-xs font-bold flex items-center justify-between ${
                      activeToken.notificationSent
                        ? 'bg-[#B9FF2C] text-[#080808]'
                        : 'bg-[#122023] text-white/60'
                    }`}
                  >
                    <span>Notification sent</span>
                    <span>{activeToken.notificationSent ? '✓' : '—'}</span>
                  </div>
                </div>

                {/* Consented Photo Picker Drawer */}
                {showPhotoSelector && (
                  <div className="my-5 p-4 rounded-[12px] bg-[#122023] border border-white/15">
                    <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#49E619] block mb-3">
                      Select Safeguarding-Cleared Community Delivery Photo:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CONSENTED_DELIVERY_PHOTOS.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            setSelectedPhotoUrl(photo.url);
                            uploadDeliveryPhoto(
                              activeToken.tokenNumber,
                              photo.url
                            );
                            setShowPhotoSelector(false);
                          }}
                          className={`rounded-[10px] text-left border p-2 transition-all cursor-pointer ${
                            selectedPhotoUrl === photo.url
                              ? 'border-[#49E619] bg-[#080808]'
                              : 'border-white/15 bg-[#080808]/60 hover:bg-[#080808]'
                          }`}
                        >
                          <div className="aspect-[4/3] rounded-[6px] overflow-hidden mb-2">
                            <EditorialImage
                              src={photo.url}
                              alt={photo.label}
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-[11px] font-medium text-white line-clamp-2">
                            {photo.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Primary Admin Action Buttons */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      markTokenDelivered(
                        activeToken.tokenNumber,
                        selectedBeneficiary,
                        selectedLocation
                      )
                    }
                    className="py-4 px-4 rounded-[10px] bg-[#49E619] hover:bg-[#B9FF2C] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MARK AS DELIVERED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      uploadDeliveryPhoto(
                        activeToken.tokenNumber,
                        selectedPhotoUrl
                      );
                      setShowPhotoSelector((prev) => !prev);
                    }}
                    className="py-4 px-4 rounded-[10px] bg-white hover:bg-[#4EDBE2] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#188D44]" />
                    <span>UPLOAD PHOTO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      markTokenDelivered(
                        activeToken.tokenNumber,
                        selectedBeneficiary,
                        selectedLocation
                      );
                      sendCustomerNotification(activeToken.tokenNumber);
                    }}
                    className="py-4 px-4 rounded-[10px] bg-[#B9FF2C] hover:bg-[#49E619] text-[#080808] font-mono-tabular text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND CUSTOMER NOTIFICATION</span>
                  </button>
                </div>

                {/* Preview of Dispatched Customer Message */}
                {activeToken.notificationSent && (
                  <div className="mt-6 rounded-[14px] bg-[#122023] text-white p-5 border-l-4 border-l-[#49E619]">
                    <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#49E619] font-bold block">
                      DISPATCHED TO CUSTOMER (WEB + EMAIL + SMS/WHATSAPP)
                    </span>
                    <p className="font-display-sans uppercase text-lg font-black mt-1">
                      Your meal has reached a child in need ❤️
                    </p>
                    <p className="font-mono-tabular text-xs text-[#B9FF2C] mt-1">
                      Token: {activeToken.tokenNumber}
                    </p>
                    <p className="text-xs text-white/75 mt-1">
                      Thank you for helping provide a nutritious meal.
                    </p>
                    <button
                      type="button"
                      onClick={() => setViewMode('CUSTOMER_TRACKER')}
                      className="mt-4 px-4 py-2 rounded-[8px] bg-[#49E619] text-[#080808] font-mono-tabular text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                    >
                      VIEW CUSTOMER IMPACT SCREEN →
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Dispatch Route Map Preview (syncs with selected Beneficiary & Hub) */}
              <DeliveryRouteMap
                token={activeToken}
                overrideLocation={selectedLocation}
                overrideBeneficiaryId={selectedBeneficiary}
                onSelectHubLocation={(hubName, beneficiaryCode) => {
                  setSelectedLocation(hubName);
                  setSelectedBeneficiary(beneficiaryCode);
                }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};