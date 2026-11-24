import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../services/database';
import { getPrimaryProductImage } from '../utils/productImages';

const CartContext = createContext(null);

const cartDocId = (productId) => String(productId).replace(/\//g, '_');

const colorSuffix = (color) => (color ? `-${String(color).replace(/\s+/g, '_')}` : '');

const cartItemIdOf = (item) =>
  item.cartItemId
    ? String(item.cartItemId)
    : `${String(item.id)}${item.selectedSize != null ? `-${item.selectedSize}` : ''}${colorSuffix(item.selectedColor)}`;

const buildCartPayload = (item) => {
  const payload = {
    id: String(item.id),
    name: item.name || 'Product',
    price: Number(item.price) || 0,
    image: getPrimaryProductImage(item),
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  };

  if (item.category) payload.category = item.category;
  if (item.gender) payload.gender = item.gender;
  if (item.selectedSize != null) payload.selectedSize = item.selectedSize;
  if (item.selectedColor) payload.selectedColor = item.selectedColor;
  if (item.cartItemId) payload.cartItemId = item.cartItemId;

  return payload;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const cartRef = useRef([]);

  const commitCart = useCallback((nextCart) => {
    cartRef.current = nextCart;
    setCart(nextCart);
  }, []);

  useEffect(() => {
    let unsubscribeCart = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeCart();

      if (!user) {
        commitCart([]);
        setCartLoading(false);
        return;
      }

      setCartLoading(true);
      unsubscribeCart = onSnapshot(
        collection(db, 'customers', user.uid, 'cart'),
        (snapshot) => {
          const items = snapshot.docs
            .map((cartDoc) => ({
              ...cartDoc.data(),
              id: cartDoc.data().id || cartDoc.id,
            }))
            .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

          commitCart(items);
          setCartLoading(false);
        },
        (error) => {
          console.error('Failed to load cloud cart:', error);
          setCartLoading(false);
        },
      );
    });

    return () => {
      unsubscribeCart();
      unsubscribeAuth();
    };
  }, [commitCart]);

  const addToCart = useCallback((product, selectedSize, selectedColor = null) => {
    const productId = String(product.id ?? product.name);
    const cartItemId = `${
      selectedSize != null ? `${productId}-${selectedSize}` : productId
    }${colorSuffix(selectedColor)}`;
    const currentCart = cartRef.current;
    const existingItem = currentCart.find((item) => cartItemIdOf(item) === cartItemId);

    if (existingItem) {
      commitCart(
        currentCart.map((item) => (
          cartItemIdOf(item) === cartItemId
            ? { ...item, selectedSize, selectedColor, quantity: (Number(item.quantity) || 0) + 1 }
            : item
        )),
      );
    } else {
      commitCart([
        ...currentCart,
        { ...product, id: productId, cartItemId, selectedSize, selectedColor, quantity: 1 },
      ]);
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const itemRef = doc(db, 'customers', uid, 'cart', cartDocId(cartItemId));

    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef);
      const serverQuantity = snapshot.exists() ? Number(snapshot.data().quantity) || 0 : 0;
      transaction.set(
        itemRef,
        buildCartPayload({
          ...product,
          id: productId,
          cartItemId,
          selectedSize,
          selectedColor,
          quantity: serverQuantity + 1,
        }),
      );
    }).catch((error) => {
      console.error('Failed to save cart item:', error);
    });
  }, [commitCart]);

  const removeFromCart = useCallback((productId) => {
    const id = String(productId);
    commitCart(cartRef.current.filter((item) => String(item.cartItemId || item.id) !== id));

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    deleteDoc(doc(db, 'customers', uid, 'cart', cartDocId(id))).catch((error) => {
      console.error('Failed to remove cart item:', error);
    });
  }, [commitCart]);

  const clearCart = useCallback(() => {
    commitCart([]);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    (async () => {
      const snapshot = await getDocs(collection(db, 'customers', uid, 'cart'));
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.forEach((cartDoc) => batch.delete(cartDoc.ref));
      await batch.commit();
    })().catch((error) => {
      console.error('Failed to clear cloud cart:', error);
    });
  }, [commitCart]);

  const cartCount = cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  const cartTotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        cartLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
