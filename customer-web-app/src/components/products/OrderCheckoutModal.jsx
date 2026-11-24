import { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../services/database';
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '../../services/customerProfile';
import { formatCurrency } from '../../utils/formatCurrency';
import { getColorHex } from '../../utils/productColors';
import { getPrimaryProductImage } from '../../utils/productImages';

const EMPTY_FORM = { name: '', phone: '', address: '' };
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const buildScreenshotPath = (file) => {
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `payment_screenshots/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension || 'jpg'}`;
};

export default function OrderCheckoutModal({ items, total, onClose, onOrderSuccess }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotError, setScreenshotError] = useState('');

  useEffect(() => {
    if (!profile) return;

    setFormData((previous) => ({
      ...previous,
      name: previous.name || profile.name || '',
      phone: previous.phone || profile.mobileNumber || '',
    }));
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onClose]);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;
    setScreenshotError('');

    if (!file) {
      setPaymentScreenshot(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPaymentScreenshot(null);
      setScreenshotError('Please upload an image file (JPG or PNG).');
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setPaymentScreenshot(null);
      setScreenshotError('The screenshot must be smaller than 5 MB.');
      return;
    }

    setPaymentScreenshot(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || items.length === 0) return;

    const customerName = formData.name.trim();
    const customerPhone = normalizePhoneNumber(formData.phone.trim());
    const customerAddress = formData.address.trim();

    if (!customerName || !customerAddress || !isValidPhoneNumber(customerPhone)) {
      setSubmitError('Please fill in your name, mobile number and delivery address.');
      return;
    }
    if (!paymentScreenshot) {
      setSubmitError('Please upload your UPI payment screenshot before placing the order.');
      return;
    }

    setLoading(true);
    setSubmitError('');

    const orderItems = items.map((item) => ({
      shoeId: item.id,
      shoeName: item.name,
      shoePrice: item.price,
      shoeImage: getPrimaryProductImage(item),
      shoeCategory: item.category || null,
      shoeGender: item.gender || null,
      selectedSize: item.selectedSize ?? null,
      selectedColor: item.selectedColor || null,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    }));
    const firstItem = orderItems[0];
    const screenshotPath = buildScreenshotPath(paymentScreenshot);

    try {
      const screenshotRef = ref(storage, screenshotPath);
      await uploadBytes(screenshotRef, paymentScreenshot, {
        contentType: paymentScreenshot.type || 'image/jpeg',
      });
      const paymentScreenshotUrl = await getDownloadURL(screenshotRef);

      await addDoc(collection(db, 'Orders'), {
        shoeId: firstItem.shoeId,
        shoeName: orderItems.length === 1
          ? firstItem.shoeName
          : orderItems.map((item) => `${item.shoeName} × ${item.quantity}`).join(', '),
        shoePrice: total,
        shoeImage: firstItem.shoeImage,
        shoeCategory: firstItem.shoeCategory,
        shoeGender: firstItem.shoeGender,
        quantity: firstItem.quantity,
        lineTotal: firstItem.lineTotal,
        totalPrice: total,
        items: orderItems,
        customerName,
        customerPhone,
        mobileNumber: customerPhone,
        customerUid: user?.uid || null,
        customerAddress,
        paymentScreenshotUrl,
        status: 'New',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
      setPaymentScreenshot(null);
      onOrderSuccess?.();
    } catch (error) {
      console.error('Failed to send order:', error);
      setSubmitError(
        error?.code === 'storage/unauthorized'
          ? 'The payment screenshot could not be uploaded. Please try again.'
          : 'We could not place your order. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (!loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="checkout-title" className="text-xl font-extrabold text-gray-900">
            Checkout
          </h2>
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Close checkout"
            className="rounded-full bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">Order placed successfully!</h3>
            <p className="text-gray-500">
              We received your payment screenshot and will contact you shortly to confirm delivery.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-gray-900 p-3 font-bold text-white transition-colors hover:bg-gray-800"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-2.5">
              {items.map((item) => (
                <div key={item.cartItemId || item.id} className="flex items-center gap-3">
                  <img
                    src={getPrimaryProductImage(item)}
                    alt={item.name}
                    className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                    {item.selectedSize != null && (
                      <p className="text-xs font-medium text-gray-500">
                        Size: {item.selectedSize}
                      </p>
                    )}
                    {item.selectedColor && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ backgroundColor: getColorHex(item.selectedColor), borderColor: '#D1D5DB' }}
                        />
                        Color: {item.selectedColor}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {submitError && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label htmlFor="customer-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Full Name
                </label>
                <input
                  id="customer-name"
                  required
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </div>

              <div>
                <label htmlFor="customer-phone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mobile Number
                </label>
                <input
                  id="customer-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 00000 00000"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                />
              </div>

              <div>
                <label htmlFor="customer-address" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Delivery Address
                </label>
                <textarea
                  id="customer-address"
                  required
                  rows={2}
                  autoComplete="street-address"
                  placeholder="Sangamner - Ashwi BK..."
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pay {formatCurrency(total)} via UPI
                </p>
                <img
                  src="/upi-qr.jpeg"
                  alt="Kahale Footwear UPI QR Code"
                  className="w-48 h-48 mx-auto"
                />
                <p className="mt-2 text-center text-xs text-gray-500">
                  Scan with any UPI app, complete the payment, then upload the screenshot below.
                </p>

                <label
                  htmlFor="payment-screenshot"
                  className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-red-300 hover:text-red-600"
                >
                  <Upload className="h-4 w-4" />
                  {paymentScreenshot ? paymentScreenshot.name : 'Upload Payment Screenshot'}
                </label>
                <input
                  id="payment-screenshot"
                  required
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="sr-only"
                />
                {paymentScreenshot && (
                  <p className="mt-1.5 text-center text-xs font-medium text-green-600">
                    Screenshot attached
                  </p>
                )}
                {screenshotError && (
                  <p className="mt-1.5 text-center text-xs font-medium text-red-600" role="alert">
                    {screenshotError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !paymentScreenshot}
                className="mt-1 w-full rounded-xl bg-gray-900 p-3 text-base font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 active:scale-[0.98] disabled:bg-gray-400 disabled:shadow-none"
              >
                {loading ? 'Uploading & Placing Order...' : `Order Now · ${formatCurrency(total)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
