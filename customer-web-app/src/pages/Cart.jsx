import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getColorHex } from '../utils/productColors';
import { getPrimaryProductImage } from '../utils/productImages';
import OrderCheckoutModal from '../components/products/OrderCheckoutModal';

export default function Cart() {
  const { cart, cartTotal, removeFromCart, clearCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <section className="min-h-[60vh] bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-gray-600">Your cart is empty.</p>
            <Link
              to="/catalog/Men"
              className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <article
                key={item.cartItemId || item.id}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6"
              >
                <img
                  src={getPrimaryProductImage(item)}
                  alt={item.name}
                  className="h-24 w-24 rounded-xl bg-gray-50 object-contain p-2"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {[item.gender, item.category].filter(Boolean).join(' · ')}
                  </p>
                  <h2 className="mt-1 truncate font-bold text-gray-900">{item.name}</h2>
                  {item.selectedSize != null && (
                    <p className="mt-1 text-sm font-medium text-gray-500">
                      Size: {item.selectedSize}
                    </p>
                  )}
                  {item.selectedColor && (
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border"
                        style={{ backgroundColor: getColorHex(item.selectedColor), borderColor: '#D1D5DB' }}
                      />
                      Color: {item.selectedColor}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(item.price)} · Quantity: {item.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.cartItemId || item.id)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </button>
              </article>
            ))}

            <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-gray-900">{formatCurrency(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full rounded-xl bg-red-600 px-6 py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              Order Now · {formatCurrency(cartTotal)}
            </button>
          </div>
        )}
      </div>
      {isCheckoutOpen && cart.length > 0 && (
        <OrderCheckoutModal
          items={cart}
          total={cartTotal}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={clearCart}
        />
      )}
    </section>
  );
}