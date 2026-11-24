import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/database';

const getCreatedAtMillis = (createdAt) => {
  if (createdAt && typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  if (typeof createdAt === 'string') {
    const parsedDate = Date.parse(createdAt);
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
  }
  return 0;
};

export function useInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onSnapshot(collection(db, 'shoes'), (snapshot) => {
      const inventoryList = snapshot.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
        .sort((a, b) => getCreatedAtMillis(b.createdAt) - getCreatedAtMillis(a.createdAt));
      setProducts(inventoryList);
      setLoading(false);
      setError(null);
    }, (inventoryError) => {
      console.error('Failed to load inventory:', inventoryError);
      setError(inventoryError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { products, loading, error, isConfigured: isFirebaseConfigured };
}
