import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ShoeCard from '../components/products/ShoeCard';
import { useInventory } from '../hooks/useInventory';

const MEN_CATEGORIES = ['All', 'Sandals', 'Sports Shoes', 'Sneakers', 'Formal Shoes', 'Loafers', 'School Shoes'];
const WOMEN_CATEGORIES = ['All', 'Sandals', 'Shoes', 'Chappals'];

const normalizeCategory = (category) => {
  if (category?.toLowerCase() === 'formal') return 'Formal Shoes';
  return category;
};

const normalizeSearchTerm = (value) => String(value ?? '').toLowerCase().trim();

export default function Catalog() {
  const { gender } = useParams();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const { products, loading, error } = useInventory();

  const normalizedGender = gender?.toLowerCase() === 'men'
    ? 'Men'
    : gender?.toLowerCase() === 'women'
      ? 'Women'
      : null;
  const isNewArrivals = searchParams.get('new') === 'true';
  const requestedCategory = searchParams.get('category');
  const searchTerm = searchParams.get('q') || '';
  const categories = normalizedGender === 'Women' ? WOMEN_CATEGORIES : MEN_CATEGORIES;
  const availableProducts = products;
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  useEffect(() => {
    const allowedCategories = normalizedGender === 'Women' ? WOMEN_CATEGORIES : MEN_CATEGORIES;
    setActiveCategory((currentCategory) => {
      if (requestedCategory && allowedCategories.includes(requestedCategory)) {
        return requestedCategory;
      }
      return allowedCategories.includes(currentCategory) ? currentCategory : 'All';
    });
  }, [normalizedGender, requestedCategory]);

  const filteredProducts = useMemo(() => availableProducts.filter((shoe) => {
    const shoeGender = shoe.gender || (shoe.category === 'Men' || shoe.category === 'Women' ? shoe.category : null);
    const matchesGender = shoeGender?.toLowerCase() === normalizedGender?.toLowerCase();
    const matchesCategory = activeCategory === 'All' || normalizeCategory(shoe.category) === activeCategory;
    const matchesNew = !isNewArrivals || shoe.isNew === true;
    const searchableText = `${shoe.name || ''} ${shoe.description || ''}`.toLowerCase();
    const matchesSearch = !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);
    return matchesGender && matchesCategory && matchesNew && matchesSearch;
  }), [availableProducts, normalizedGender, activeCategory, isNewArrivals, normalizedSearchTerm]);

  if (!normalizedGender) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Choose a collection</h1>
        <div className="flex gap-4 mt-5">
          <Link className="text-red-600 font-semibold hover:underline" to="/catalog/Men">Men</Link>
          <Link className="text-red-600 font-semibold hover:underline" to="/catalog/Women">Women</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-2">
            {isNewArrivals ? 'New Arrivals' : `${normalizedGender}'s footwear`}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            {isNewArrivals ? 'Fresh picks for every step' : `${normalizedGender}'s Collection`}
          </h1>
          <p className="text-gray-500 mt-2">
            {isNewArrivals
              ? 'Explore the latest additions to our collection.'
              : `Browse our ${normalizedGender.toLowerCase()}’s footwear by category.`}
          </p>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-4 mb-8" aria-label="Filter products by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Loading products">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-red-100" role="alert">
            <h2 className="text-xl font-bold text-gray-900">Products could not be loaded.</h2>
            <p className="text-gray-500 mt-2">Check the Firebase configuration and connection, then reload this page.</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.map((shoe) => (
                <ShoeCard key={shoe.id} shoe={shoe} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {isNewArrivals
                ? 'No new arrivals right now.'
                : activeCategory === 'All'
                  ? `No ${normalizedGender.toLowerCase()} products available yet.`
                  : `No ${activeCategory.toLowerCase()} found.`}
            </h2>
            <p className="text-gray-500 mt-2">
              New products added by the shop will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
