import { Link } from 'react-router-dom';
import ShoeCard from '../components/products/ShoeCard';
import { useInventory } from '../hooks/useInventory';

export default function Home() {
  const { products, loading, error } = useInventory();
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="w-full">
      <section className="relative overflow-hidden bg-red-600 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.14), transparent 28%), radial-gradient(circle at 78% 12%, rgba(0,0,0,0.12), transparent 22%)',
          }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:py-20 lg:py-24">
          <h1 className="font-script text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.95] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.22)]">
            Kahale Footwear
          </h1>

          <div className="mt-7 flex flex-col items-center gap-2 sm:mt-9">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/80 sm:text-sm">
              Sangamner - Ashwi BK.
            </p>
            <a
              href="tel:9579733238"
              className="text-lg font-bold tracking-[0.18em] text-white underline-offset-4 transition-opacity hover:opacity-80 hover:underline sm:text-xl"
            >
              9579733238
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured Footwear</h2>
            <p className="mt-2 text-gray-500">Curated selections for this season.</p>
          </div>
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700 sm:shrink-0"
          >
            View all products
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              -&gt;
            </span>
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            The live catalog could not be loaded. Please try again later.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Loading products">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-600" />
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {featuredProducts.map((shoe) => (
              <ShoeCard key={shoe.id} shoe={shoe} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-gray-900">New footwear is on the way.</h3>
            <p className="mt-2 text-gray-500">Check back soon to see the latest additions.</p>
          </div>
        )}
      </section>
    </div>
  );
}
