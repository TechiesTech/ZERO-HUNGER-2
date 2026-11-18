import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronRight, ClipboardList, PackageOpen } from 'lucide-react';
import { cancelOrder, getMyOrders } from '../services/orderService';
import type { DeliveryAddress, MyOrderSummary, OrderItem } from '../services/orderService';
import { getTrackingData } from '../services/trackingService';
import type { TrackingData } from '../services/trackingService';

interface MyOrdersModalProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  readyforpickup: 'Ready for pickup',
  outfordelivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  preparing: 'bg-amber-50 text-amber-700',
  readyforpickup: 'bg-amber-50 text-amber-700',
  outfordelivery: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const statusLabel = (status: string) => STATUS_LABELS[status] ?? status;
const formatInr = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'}`}>
    {statusLabel(status)}
  </span>
);

function getAddressText(address?: Partial<DeliveryAddress>) {
  if (!address) return '';
  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(', ');
}

function getItems(order: MyOrderSummary, tracking?: TrackingData) {
  if (order.items?.length) return order.items;
  return tracking?.items ?? [];
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ open, onClose }) => {
  const [orders, setOrders] = useState<MyOrderSummary[]>([]);
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, TrackingData>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPage = useCallback(async (nextPage: number, replace: boolean) => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyOrders(nextPage, PAGE_SIZE);
      setOrders((current) => (replace ? response.data.orders : [...current, ...response.data.orders]));
      setPage(nextPage);
      setTotalPages(response.data.pagination.totalPages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setConfirmingCancel(false);
    setCancelError('');
    setDetailError('');
    setNotice('');
    setTrackingByOrder({});
    setOrders([]);
    setPage(1);
    setTotalPages(1);
    void loadPage(1, true);
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !cancelling) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, cancelling, onClose]);

  const selected = orders.find((order) => order._id === selectedId) ?? null;
  const tracking = selected ? trackingByOrder[selected.orderNumber] : undefined;
  const items = selected ? getItems(selected, tracking) : [];
  const addressText = selected ? getAddressText(selected.deliveryAddress) : '';
  const canCancel = tracking?.canCancel === true;

  const openOrder = async (order: MyOrderSummary) => {
    setSelectedId(order._id);
    setConfirmingCancel(false);
    setCancelError('');
    setDetailError('');
    setNotice('');
    setTrackingByOrder((current) => {
      const next = { ...current };
      delete next[order.orderNumber];
      return next;
    });
    setDetailLoading(true);
    try {
      const response = await getTrackingData(order.orderNumber);
      setTrackingByOrder((current) => ({ ...current, [order.orderNumber]: response.data }));
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : 'Could not load order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => {
    setSelectedId(null);
    setConfirmingCancel(false);
    setCancelError('');
    setDetailError('');
  };

  const handleCancel = async () => {
    if (!selected || !canCancel) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelOrder(selected.orderNumber);
      setOrders((current) =>
        current.map((order) =>
          order._id === selected._id
            ? { ...order, customerMealStatus: 'cancelled' }
            : order
        )
      );
      setTrackingByOrder((current) => {
        const next = { ...current };
        delete next[selected.orderNumber];
        return next;
      });
      setConfirmingCancel(false);
      setNotice(`Order ${selected.orderNumber} has been cancelled.`);
    } catch (cancelRequestError) {
      setCancelError(cancelRequestError instanceof Error ? cancelRequestError.message : 'Could not cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#080808]/80 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !cancelling) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-orders-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[16px] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#122023]/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {selected && (
              <button
                type="button"
                onClick={backToList}
                aria-label="Back to all orders"
                className="mt-1 text-[#122023]/60 hover:text-[#122023]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#188D44]">Orders</p>
              <h2 id="my-orders-title" className="mt-1 text-2xl font-black text-[#122023]">
                {selected ? selected.orderNumber : 'All Orders'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            aria-label="Close my orders"
            className="text-2xl leading-none text-[#122023]/60 hover:text-[#122023] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {notice && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
          {error && !selected && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {selected ? (
            <div className="space-y-5">
              {cancelError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{cancelError}</p>}
              {detailError && (
                <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <p>{detailError}</p>
                  <button
                    type="button"
                    onClick={() => void openOrder(selected)}
                    className="mt-2 font-bold underline"
                  >
                    Retry loading live details
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={tracking?.customerMealStatus ?? selected.customerMealStatus} />
                <span className="text-right text-xs text-[#6F6F6F]">Placed {formatDate(selected.createdAt)}</span>
              </div>

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">Items</h3>
                <ul className="divide-y divide-[#122023]/10 rounded-[10px] border border-[#122023]/10">
                  {items.map((item, index) => (
                    <li
                      key={`${'mealId' in item ? item.mealId : item.productName}-${index}`}
                      className="flex items-start justify-between gap-3 p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-[#122023]">{item.productName ?? 'Meal'}</p>
                        <p className="text-xs text-[#6F6F6F]">
                          {item.quantity} × {formatInr(item.unitPriceInr ?? 0)}
                        </p>
                      </div>
                      <p className="font-semibold text-[#122023]">{formatInr(item.totalPriceInr ?? 0)}</p>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="p-3 text-sm text-[#6F6F6F]">
                      {detailLoading ? 'Loading item details...' : 'No item details available.'}
                    </li>
                  )}
                </ul>
              </section>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6F6F6F]">Total</dt>
                  <dd className="font-bold text-[#122023]">{formatInr(selected.totalAmountInr)}</dd>
                </div>
                {selected.sponsoredMealsCount > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6F6F6F]">Meals gifted to children</dt>
                    <dd className="font-semibold text-[#188D44]">{selected.sponsoredMealsCount}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6F6F6F]">Payment</dt>
                  <dd className="font-semibold capitalize text-[#122023]">
                    {[selected.paymentMethod, tracking?.paymentStatus ?? selected.paymentStatus].filter(Boolean).join(' · ') || '—'}
                  </dd>
                </div>
                {addressText && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-[#6F6F6F]">Deliver to</dt>
                    <dd className="text-right text-[#122023]">{addressText}</dd>
                  </div>
                )}
              </dl>

              {tracking?.timeline?.length ? (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">Order timeline</h3>
                  <ol className="space-y-2 border-l-2 border-[#188D44]/30 pl-4">
                    {tracking.timeline.map((step, index) => (
                      <li key={`${step.status}-${index}`} className="relative text-sm">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#188D44]" />
                        <span className="font-semibold text-[#122023]">{statusLabel(step.status)}</span>
                        {step.at && <span className="ml-2 text-xs text-[#6F6F6F]">{formatDate(step.at)}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : detailLoading ? (
                <p role="status" className="text-sm text-[#6F6F6F]">Loading order timeline...</p>
              ) : null}

              {tracking?.kitchen && (
                <section className="rounded-[10px] bg-gray-50 p-3 text-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">Kitchen</h3>
                  <p className="mt-1 font-semibold text-[#122023]">{tracking.kitchen.name}</p>
                  {typeof tracking.kitchen.address === 'string' && (
                    <p className="mt-0.5 text-[#6F6F6F]">{tracking.kitchen.address}</p>
                  )}
                </section>
              )}

              {tracking?.rider && (
                <section className="rounded-[10px] bg-gray-50 p-3 text-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">Delivery rider</h3>
                  <p className="mt-1 font-semibold text-[#122023]">{tracking.rider.name || 'Assigned'}</p>
                  {tracking.rider.phone && <p className="text-[#6F6F6F]">{tracking.rider.phone}</p>}
                  {tracking.rider.isLocationStale && (
                    <p className="mt-1 text-xs text-[#6F6F6F]">Live location is temporarily unavailable.</p>
                  )}
                </section>
              )}

              {detailLoading && <p role="status" className="text-sm text-[#6F6F6F]">Loading latest order status...</p>}

              {canCancel ? (
                confirmingCancel ? (
                  <div className="space-y-3 rounded-[10px] border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">Cancel this order? This cannot be undone.</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => void handleCancel()}
                        className="flex-1 rounded-[8px] bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, cancel order'}
                      </button>
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => setConfirmingCancel(false)}
                        className="flex-1 rounded-[8px] border border-[#122023]/20 px-4 py-2.5 text-sm font-bold text-[#122023] hover:bg-white disabled:opacity-50"
                      >
                        Keep order
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="w-full rounded-[8px] border border-red-300 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    Cancel order
                  </button>
                )
              ) : detailLoading ? (
                <p className="text-xs text-[#6F6F6F]">Checking whether this order can be cancelled...</p>
              ) : tracking && tracking.customerMealStatus !== 'cancelled' && tracking.customerMealStatus !== 'delivered' ? (
                <p className="rounded-md bg-gray-50 p-3 text-xs text-[#6F6F6F]">
                  This order can no longer be cancelled. Cancellation is only available while the order is confirmed and payment is incomplete.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {!loading && !error && orders.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-[#6F6F6F]">
                  <PackageOpen className="h-10 w-10" />
                  <p className="text-sm">You have not placed any orders yet.</p>
                </div>
              )}

              <ul className="space-y-3">
                {orders.map((order) => (
                  <li key={order._id}>
                    <button
                      type="button"
                      onClick={() => void openOrder(order)}
                      className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#122023]/15 p-4 text-left hover:border-[#49E619] hover:bg-[#49E619]/5"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-bold text-[#122023]">{order.orderNumber}</p>
                        {order.items?.length ? (
                          <p className="truncate text-xs text-[#6F6F6F]">
                            {order.items.map((item) => `${item.productName ?? 'Meal'} ×${item.quantity}`).join(', ')}
                          </p>
                        ) : null}
                        <p className="text-xs text-[#6F6F6F]">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="space-y-1 text-right">
                          <p className="text-sm font-bold text-[#122023]">{formatInr(order.totalAmountInr)}</p>
                          <StatusBadge status={order.customerMealStatus} />
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#122023]/40" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {loading && <p role="status" className="py-4 text-center text-sm text-[#6F6F6F]">Loading orders...</p>}

              {!loading && page < totalPages && (
                <button
                  type="button"
                  onClick={() => void loadPage(page + 1, false)}
                  className="mt-4 w-full rounded-[8px] border border-[#122023]/20 px-4 py-2.5 text-sm font-bold text-[#122023] hover:bg-gray-50"
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
