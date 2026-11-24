import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const linkClass = ({ isActive }) => (
  `font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${
    isActive
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
  }`
);

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalog/Men', label: 'Men' },
  { to: '/catalog/Women', label: 'Women' },
  { to: '/catalog/Men?new=true', label: 'New Arrivals' },
];

const CATEGORY_ROUTES = [
  { keywords: ['men', 'man', 'mans', 'mens', 'male', 'males'], to: '/catalog/Men?category=All' },
  { keywords: ['women', 'woman', 'womans', 'womens', 'female', 'females', 'ladies', 'lady'], to: '/catalog/Women?category=All' },
  { keywords: ['sneaker', 'sneakers'], to: '/catalog/Men?category=Sneakers' },
  { keywords: ['new', 'new arrival', 'new arrivals', 'newarrival', 'newarrivals'], to: '/catalog/Men?new=true&category=All' },
];

const normalizeSearchTerm = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const findCategoryRoute = (value) => {
  const term = normalizeSearchTerm(value);
  return CATEGORY_ROUTES.find(({ keywords }) => keywords.includes(term))?.to || null;
};

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, profile, authLoading, openLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('q') || '';
    setSearchTerm(query);
  }, [location.search]);

  const closeMenu = () => setMenuOpen(false);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();

    if (!term) {
      if (location.pathname.startsWith('/catalog/')) {
        const params = new URLSearchParams(location.search);
        params.delete('q');
        const nextSearch = params.toString();
        navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
      }
      setSearchOpen(false);
      return;
    }

    const categoryRoute = findCategoryRoute(term);
    if (categoryRoute) {
      navigate(categoryRoute);
      setSearchOpen(false);
      return;
    }

    const genderMatch = location.pathname.match(/^\/catalog\/(men|women)(?:\/|$)/i);
    const gender = genderMatch
      ? `${genderMatch[1][0].toUpperCase()}${genderMatch[1].slice(1).toLowerCase()}`
      : 'Men';
    const params = new URLSearchParams(
      location.pathname.startsWith('/catalog/') ? location.search : '',
    );
    params.set('q', term);
    navigate(`/catalog/${gender}?${params.toString()}`);
    setSearchOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            to="/"
            onClick={closeMenu}
            className="justify-self-start whitespace-nowrap text-lg sm:text-2xl font-bold tracking-tight text-gray-900"
          >
            Kahale <span className="text-red-600">Footwear</span>
          </Link>

          <div className="hidden md:flex items-center justify-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center justify-self-end gap-1 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls="navbar-search"
                onClick={() => setSearchOpen((open) => !open)}
                className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <Search className="w-5 h-5" />
              </button>
              {searchOpen && (
                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                  className="fixed left-0 right-0 top-16 z-50 w-full px-4 md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-72 md:max-w-[calc(100vw-2rem)] md:px-0"
                >
                  <label htmlFor="navbar-search" className="sr-only">
                    Search products or jump to a category
                  </label>
                  <input
                    id="navbar-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setSearchOpen(false);
                    }}
                    placeholder="Search or type men, women, sneakers..."
                    autoComplete="off"
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-lg outline-none transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-red-600"
                  />
                </form>
              )}
            </div>
            {!authLoading && (
              user ? (
                <Link
                  to="/profile"
                  aria-label="Your profile and orders"
                  title={profile?.name ? `${profile.name} · Your profile` : 'Your profile'}
                  className="flex items-center gap-2 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 sm:pr-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">
                    {profile?.name?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openLogin}
                  aria-label="Sign in"
                  className="flex items-center gap-1.5 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 sm:pr-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm font-semibold sm:inline">Sign In</span>
                </button>
              )
            )}
            <Link
              to="/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className="relative text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white box-content">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden text-gray-500 p-2 rounded-md hover:bg-gray-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden flex flex-col gap-1 border-t border-gray-100 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                onClick={closeMenu}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
