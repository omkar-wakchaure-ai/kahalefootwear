import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getColorHex, getProductColors } from '../../utils/productColors';
import { getProductImages } from '../../utils/productImages';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import OrderCheckoutModal from './OrderCheckoutModal';

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
  const { addToCart } = useCart();
  const { requireAuth } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const galleryRef = useRef(null);

  const inStock = shoe.inStock !== false;
  const productImages = getProductImages(shoe);
  const productColors = getProductColors(shoe);
  const colorKey = productColors.join('|');
  const imageSrc = productImages[0] || '';
  const availableSizes = Array.isArray(shoe.availableSizes) ? shoe.availableSizes : [];
  const imageClassName = `h-full w-full object-contain object-center transition-transform duration-500 ease-out ${
    inStock ? 'group-hover:scale-105' : 'opacity-40 grayscale'
  }`;

  useEffect(() => {
    setCurrentIndex(0);
  }, [shoe.id, productImages.length]);

  useEffect(() => {
    setSelectedColor(null);
  }, [shoe.id, colorKey]);

  const handleImageScroll = (event) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    if (!clientWidth) return;

    const nextIndex = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(Math.max(0, Math.min(nextIndex, productImages.length - 1)));
  };

  const goToImage = (index) => {
    if (productImages.length === 0) return;

    const nextIndex = (index + productImages.length) % productImages.length;
    setCurrentIndex(nextIndex);

    const gallery = galleryRef.current;
    if (gallery?.scrollTo) {
      gallery.scrollTo({ left: nextIndex * gallery.clientWidth, behavior: 'smooth' });
    }
  };

  const validateSelections = () => {
    if (!selectedSize) {
      window.alert('Please select a size');
      return false;
    }
    if (productColors.length > 0 && !selectedColor) {
      window.alert('Please select a color');
      return false;
    }
    return true;
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
            <>
              <div
                ref={galleryRef}
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

              <button
                type="button"
                onClick={() => goToImage(currentIndex - 1)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goToImage(currentIndex + 1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute right-3 top-3 z-10 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-bold text-white">
                {currentIndex + 1} / {productImages.length}
              </span>
            </>
          ) : (
            <ProductImage src={imageSrc} alt={shoe.name} className={imageClassName} />
          )}

          {!inStock && (
            <span className="absolute inset-0 z-20 flex items-center justify-center">
              <span className="rounded-full bg-gray-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Out of Stock
              </span>
            </span>
          )}

          {inStock && shoe.isNew && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              New
            </span>
          )}
        </div>

        {productImages.length > 1 && (
          <div className="mb-5 flex items-center justify-center gap-1.5" aria-label="Choose product image">
            {productImages.map((src, index) => (
              <button
                key={`${src}-dot-${index}`}
                type="button"
                onClick={() => goToImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === currentIndex}
                className={`h-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ${
                  index === currentIndex ? 'w-5 bg-gray-700' : 'w-2 bg-gray-300 hover:bg-gray-400'
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

          <div className="mt-auto border-t border-gray-50 pt-4">
            {availableSizes.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      aria-label={`Select size ${size}`}
                      className={`min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-bold transition-colors ${
                        selectedSize === size
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {productColors.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Select Color
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {productColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={selectedColor === color}
                      aria-label={`Select color ${color}`}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                        selectedColor === color
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      <span
                        className="inline-block h-4 w-4 shrink-0 rounded-full border"
                        style={{
                          backgroundColor: getColorHex(color),
                          borderColor: color === 'White' ? '#D1D5DB' : 'rgba(0, 0, 0, 0.15)',
                        }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <span className="text-xl font-extrabold text-gray-900">
              {formatCurrency(shoe.price)}
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  if (!validateSelections()) return;
                  requireAuth(() => addToCart(shoe, selectedSize, selectedColor));
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-2 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  if (!validateSelections()) return;
                  requireAuth(() => setIsModalOpen(true));
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-2 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
              >
                {inStock ? 'Buy' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <OrderCheckoutModal
          items={[{ ...shoe, quantity: 1, image: imageSrc, selectedSize, selectedColor }]}
          total={shoe.price}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
