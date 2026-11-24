import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LoginModal from './components/auth/LoginModal';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import CustomerProfile from './pages/CustomerProfile';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Navigate to="/catalog/Men" replace />} />
            <Route path="/catalog/:gender" element={<Catalog />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Kahale Footwear. All rights reserved.
        </footer>
        <LoginModal />
      </div>
    </Router>
  );
}

export default App;
