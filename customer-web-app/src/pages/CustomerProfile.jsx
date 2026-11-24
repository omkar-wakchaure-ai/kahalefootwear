import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Package,
  PackageSearch,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, functions } from '../services/database';
import { formatCurrency } from '../utils/formatCurrency';
import { getColorHex } from '../utils/productColors';

const CANCELLABLE_STATUSES = new Set(['new', 'pending', 'placed', 'confirmed']);

const isCancellable = (status) => CANCELLABLE_STATUSES.has(String(status || 'New').toLowerCase());

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getStatusMeta = (status) => {
  const normalized = String(status || 'Pending').toLowerCase();
  const label = normalized === 'new' ? 'Pending' : status;

  if (normalized.includes('complete') || normalized.includes('deliver')) {
    return {
      label,
      icon: CheckCircle2,
      className: 'border-green-200 bg-green-50 text-green-700',
    };
  }
  if (normalized.includes('cancel') || normalized.includes('reject')) {
    return {
      label,
      icon: XCircle,
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  return {
    label,
    icon: Clock,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
};

export default function CustomerProfile() {
  const { user, profile, authLoading, openLogin, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const sourcesRef = useRef({ customerPhone: new Map(), mobileNumber: new Map() });

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState('');

  const mobileNumber = profile?.mobileNumber || user?.phoneNumber || '';

  useEffect(() => {
    if (!user || !mobileNumber) {
      sourcesRef.current = { customerPhone: new Map(), mobileNumber: new Map() };
      setOrders([]);
      setOrdersLoading(false);
      return undefined;
    }

    setOrdersLoading(true);
    setOrdersError('');
    sourcesRef.current = { customerPhone: new Map(), mobileNumber: new Map() };

    const publishOrders = () => {
      const merged = new Map([
        ...sourcesRef.current.mobileNumber.entries(),
        ...sourcesRef.current.customerPhone.entries(),
      ]);
      const nextOrders = Array.from(merged.values()).sort((a, b) => {
        const aTime = toDate(a.createdAt)?.getTime() || 0;
        const bTime = toDate(b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      });
      setOrders(nextOrders);
      setOrdersLoading(false);
    };

    const unsubscribeCustomerPhone = onSnapshot(
      query(collection(db, 'Orders'), where('customerPhone', '==', mobileNumber)),
      (snapshot) => {
        sourcesRef.current.customerPhone = new Map(
          snapshot.docs.map((orderDoc) => [orderDoc.id, { id: orderDoc.id, ...orderDoc.data() }]),
        );
        publishOrders();
        setOrdersError('');
      },
      (error) => {
        console.error('Failed to load orders by customerPhone:', error);
        setOrdersError('We could not load your orders right now. Please try again.');
        setOrdersLoading(false);
      },
    );

    const unsubscribeMobileNumber = onSnapshot(
      query(collection(db, 'Orders'), where('mobileNumber', '==', mobileNumber)),
      (snapshot) => {
        sourcesRef.current.mobileNumber = new Map(
          snapshot.docs.map((orderDoc) => [orderDoc.id, { id: orderDoc.id, ...orderDoc.data() }]),
        );
        publishOrders();
        setOrdersError('');
      },
      (error) => {
        console.error('Failed to load orders by mobileNumber:', error);
      },
    );

    return () => {
      unsubscribeCustomerPhone();
      unsubscribeMobileNumber();
    };
  }, [mobileNumber, user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!cancelTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !cancelling) setCancelTarget(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelTarget, cancelling]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelling) return;

    setCancelling(true);
    setCancelError('');

    try {
      const cancelOrder = httpsCallable(functions, 'cancelOrder');
      await cancelOrder({
        orderId: cancelTarget.id,
        reason: cancelReason.trim() || 'Cancelled by customer',
      });
      setToast('Order cancelled successfully. The shopkeeper has been notified.');
      setCancelTarget(null);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      setCancelError(error?.data?.message || 'We could not cancel this order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const displayName = profile?.name || user?.displayName || 'Customer';
  const displayMobile = profile?.mobileNumber || user?.phoneNumber || 'Mobile number unavailable';

  const headerContent = useMemo(() => {
    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-red-600" />
          <p role="status">Loading your account…</p>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sign in to view your orders</h1>
          <p className="mt-2 text-gray-500">
            Verify your mobile number to see live order status and keep your cart saved.
          </p>
          <button
            type="button"
            onClick={openLogin}
            className="mt-6 w-full rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            Sign In with Mobile
          </button>
        </div>
      );
    }

    return null;
  }, [authLoading, openLogin, user]);

  if (headerContent) {
    return (
      <section className="min-h-[60vh] bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">{headerContent}</div>
      </section>
    );
  }

  return (
    <section className="min-h-[60vh] bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500">{displayMobile}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900">Your Orders</h2>
          <Link
            to="/catalog/Men"
            className="text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Continue shopping
          </Link>
        </div>

        {ordersError && (
          <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-white p-4 text-sm text-gray-600">
            {ordersError}
          </p>
        )}

        {ordersLoading ? (
          <div className="flex justify-center py-16" role="status" aria-label="Loading orders">
            <Loader2 className="h-9 w-9 animate-spin text-red-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <PackageSearch className="mx-auto mb-4 h-14 w-14 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
            <p className="mt-1 text-gray-500">
              Orders placed with {displayMobile} will appear here automatically.
            </p>
            <Link
              to="/catalog/Men"
              className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusMeta = getStatusMeta(order.status);
              const StatusIcon = statusMeta.icon;
              const isOrderCancelled = String(order.status || '').toLowerCase().includes('cancel');
              const orderItems = Array.isArray(order.items) && order.items.length > 0
                ? order.items
                : [{
                  shoeId: order.shoeId,
                  shoeName: order.shoeName,
                  shoePrice: order.shoePrice,
                  shoeImage: order.shoeImage,
                  selectedSize: order.selectedSize,
                  selectedColor: order.selectedColor,
                  quantity: order.quantity || 1,
                }];
              const orderTotal = Number(order.totalPrice ?? order.shoePrice ?? 0);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Order #{String(order.id).slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusMeta.label}
                      </span>
                      {isCancellable(order.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(order);
                            setCancelReason('');
                            setCancelError('');
                          }}
                          className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 px-5 py-4">
                    {orderItems.map((item, index) => (
                      <div key={`${order.id}-${item.shoeId || index}`} className="flex items-center gap-3">
                        {item.shoeImage ? (
                          <img
                            src={item.shoeImage}
                            alt={item.shoeName || 'Ordered product'}
                            className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.shoeName || 'Product'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(Number(item.shoePrice) || 0)} × {item.quantity || 1}
                            {item.selectedSize != null && ` · Size ${item.selectedSize}`}
                          </p>
                          {item.selectedColor && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <span
                                className="inline-block h-3 w-3 rounded-full border"
                                style={{ backgroundColor: getColorHex(item.selectedColor), borderColor: '#D1D5DB' }}
                              />
                              Color: {item.selectedColor}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-900">
                          {formatCurrency((Number(item.shoePrice) || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isOrderCancelled && (
                    <div className="mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                      <p className="font-bold">Cancelled by customer</p>
                      <p className="mt-0.5">Reason: {order.cancelReason || 'Cancelled by customer'}</p>
                      <p className="mt-0.5">Cancelled on: {formatDateTime(order.cancelledAt)}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                    <span className="text-sm font-semibold text-gray-500">Order total</span>
                    <span className="text-lg font-extrabold text-gray-900">
                      {formatCurrency(orderTotal)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelling) setCancelTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="cancel-order-title" className="text-xl font-extrabold text-gray-900">
                Cancel this order?
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                aria-label="Close cancellation dialog"
                className="rounded-full bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Order #{String(cancelTarget.id).slice(-6).toUpperCase()} will be cancelled and the shopkeeper
              will be notified immediately. This action cannot be undone.
            </p>

            <label htmlFor="cancel-reason" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reason (optional)
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              maxLength={300}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Tell us why you are cancelling"
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-red-600"
            />

            {cancelError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
