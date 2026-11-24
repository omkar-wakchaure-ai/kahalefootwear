import { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, CheckCircle2, ImageOff, ShoppingCart, X } from 'lucide-react';
import { db } from '../../services/database';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductImages } from '../../utils/productImages';

const ORDERS_COLLECTION = 'Orders';
const EMPTY_FORM = { name: '', phone: '', address: '' };

function ProductImage({ src, alt, className }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`}>
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
      className={className}
    />
  );
}

export default function ShoeCard({ shoe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [currentIndex, setCurrentIndex] = useState(0);

  const inStock = shoe.inStock !== false;
  const productImages = getProductImages(shoe);
  const imageSrc = productImages[0] || '';
  const imageClassName = `h-full w-full object-contain object-center transition-transform duration-500 ease-out ${
    inStock ? 'group-hover:scale-105' : 'opacity-40 grayscale'
  }`;

  useEffect(() => {
    setCurrentIndex(0);
  }, [shoe.id, productImages.length]);

  const handleImageScroll = (event) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    if (!clientWidth) return;

    const nextIndex = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(Math.max(0, Math.min(nextIndex, productImages.length - 1)));
  };

  const closeModal = () => {
    if (loading) return;
    setIsModalOpen(false);
    setSuccess(false);
    setSubmitError('');
    setFormData(EMPTY_FORM);
  };

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) closeModal();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, loading]);

  const handleBuySubmit = async (event) => {
    event.preventDefault();
    if (!inStock) return;

    setLoading(true);
    setSubmitError('');

    try {
      await addDoc(collection(db, ORDERS_COLLECTION), {
        shoeId: shoe.id,
        shoeName: shoe.name,
        shoePrice: shoe.price,
        shoeImage: imageSrc,
        shoeCategory: shoe.category || null,
        shoeGender: shoe.gender || null,
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerAddress: formData.address.trim(),
        status: 'New',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error('Failed to send order:', error);
      setSubmitError('We could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div
          className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-gray-100 ${
            inStock ? 'bg-gray-50' : 'bg-gray-200'
          } ${productImages.length > 1 ? 'mb-3' : 'mb-5'}`}
        >
          {productImages.length > 1 ? (
            <div
              className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
              aria-label={`${shoe.name} images`}
              onScroll={handleImageScroll}
            >
              {productImages.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="flex h-full w-full flex-none snap-center items-center justify-center"
                >
                  <ProductImage
                    src={src}
                    alt={`${shoe.name} image ${index + 1}`}
                    className={imageClassName}
                  />
                </div>
              ))}
            </div>
          ) : (
            <ProductImage src={imageSrc} alt={shoe.name} className={imageClassName} />
          )}

          {!inStock && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-gray-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Out of Stock
              </span>
            </span>
          )}

          {inStock && shoe.isNew && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              New
            </span>
          )}
        </div>

        {productImages.length > 1 && (
          <div className="mb-5 flex items-center justify-center gap-1.5" aria-hidden="true">
            {productImages.map((src, index) => (
              <span
                key={`${src}-dot-${index}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-grow flex-col">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            {[shoe.gender, shoe.category].filter(Boolean).join(' · ')}
          </p>
          <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-tight text-gray-900">
            {shoe.name}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
            <span className="text-xl font-extrabold text-gray-900">
              {formatCurrency(shoe.price)}
            </span>
            <button
              type="button"
              disabled={!inStock}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
            >
              {inStock ? (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Buy
                </>
              ) : (
                'Out of Stock'
              )}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
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
            className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="checkout-title" className="text-2xl font-extrabold text-gray-900">
                Checkout
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                aria-label="Close checkout"
                className="rounded-full bg-gray-100 p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                <h3 className="mb-2 text-xl font-bold text-gray-900">Order placed successfully!</h3>
                <p className="text-gray-500">
                  We will contact you shortly to confirm your delivery.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 w-full rounded-xl bg-gray-900 p-3.5 font-bold text-white transition-colors hover:bg-gray-800"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <ProductImage
                    src={imageSrc}
                    alt={shoe.name}
                    className="h-20 w-20 rounded-xl bg-gray-100 object-contain p-1 shadow-sm"
                  />
                  <div>
                    <p className="text-lg font-bold leading-tight text-gray-900">{shoe.name}</p>
                    <p className="mt-1 font-semibold text-gray-600">{formatCurrency(shoe.price)}</p>
                  </div>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleBuySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="customer-name" className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="customer-name"
                      required
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-phone" className="mb-1 block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <input
                      id="customer-phone"
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 00000 00000"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-address" className="mb-1 block text-sm font-medium text-gray-700">
                      Delivery Address
                    </label>
                    <textarea
                      id="customer-address"
                      required
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Sangamner - Ashwi BK..."
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
                      value={formData.address}
                      onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !inStock}
                    className="mt-2 w-full rounded-xl bg-gray-900 p-4 text-lg font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 active:scale-[0.98] disabled:bg-gray-400 disabled:shadow-none"
                  >
                    {loading ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
