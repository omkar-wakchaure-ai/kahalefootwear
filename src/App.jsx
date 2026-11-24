import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';

const Cart = () => <div className="p-20 text-center text-2xl font-bold">Cart Page Coming Soon</div>;

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Kahale Footwear. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
