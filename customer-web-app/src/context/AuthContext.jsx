import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/database';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const pendingActionRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (!nextUser) {
        setProfile(null);
        setLoginOpen(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'customers', user.uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      },
      (error) => {
        console.error('Failed to load customer profile:', error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const openLogin = useCallback(() => setLoginOpen(true), []);

  const closeLogin = useCallback(() => {
    pendingActionRef.current = null;
    setLoginOpen(false);
  }, []);

  const requireAuth = useCallback((action) => {
    if (auth.currentUser) {
      action?.();
      return true;
    }

    pendingActionRef.current = action || null;
    setLoginOpen(true);
    return false;
  }, []);

  const completeLogin = useCallback(() => {
    setLoginOpen(false);
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pendingAction) {
      window.setTimeout(pendingAction, 0);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = {
    user,
    profile,
    authLoading,
    loginOpen,
    openLogin,
    closeLogin,
    requireAuth,
    completeLogin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
