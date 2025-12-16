"use client";

import type { Product, CartItem } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<Product, 'description' | 'imageHint' | 'createdAt'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  loading: boolean;
  delivery: boolean;
  setDelivery: React.Dispatch<React.SetStateAction<boolean>>;
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  deliveryFee: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "docelink_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [delivery, setDelivery] = useState(false);
  const [location, setLocation] = useState("");
  const deliveryFee = 10;

  const getLocalCart = useCallback((): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error reading cart from local storage", error);
      return [];
    }
  }, []);

  const setLocalCart = useCallback((cartItems: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to local storage", error);
    }
  }, []);

  const mergeAndClearLocalCart = useCallback(async (userId: string) => {
    const localCart = getLocalCart();
    if (localCart.length === 0) return;

    const cartRef = collection(db, "carts", userId, "items");
    const remoteSnapshot = await getDocs(cartRef);
    const remoteItems = new Map(remoteSnapshot.docs.map(d => [d.id, d.data() as CartItem]));

    const batch = writeBatch(db);

    localCart.forEach(localItem => {
      const remoteItem = remoteItems.get(localItem.productId);
      if (remoteItem) {
        const newQuantity = remoteItem.quantity + localItem.quantity;
        batch.update(doc(cartRef, localItem.productId), { quantity: newQuantity });
      } else {
        batch.set(doc(cartRef, localItem.productId), localItem);
      }
    });

    await batch.commit();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [getLocalCart]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      setLoading(true);
      mergeAndClearLocalCart(user.uid).then(() => {
        const cartRef = collection(db, "carts", user.uid, "items");
        const unsubscribe = onSnapshot(cartRef, (snapshot) => {
          const cloudItems = snapshot.docs.map(d => d.data() as CartItem);
          setCartItems(cloudItems);
          setLoading(false);
        }, (error) => {
            console.error("Error with cart snapshot:", error)
            setLoading(false);
        });
        return () => unsubscribe();
      });
    } else {
      setCartItems(getLocalCart());
      setLoading(false);
    }
  }, [user, authLoading, getLocalCart, mergeAndClearLocalCart]);


  const addToCart = async (product: Omit<Product, 'description' | 'imageHint' | 'createdAt'>, quantity = 1) => {
    if (product.stock === 0) return;
    
    if (user) {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      const docSnap = await getDoc(itemRef);
      if (docSnap.exists()) {
        const existingItem = docSnap.data() as CartItem;
        const newQuantity = existingItem.quantity + quantity;
        await setDoc(itemRef, { quantity: newQuantity > product.stock ? product.stock : newQuantity }, { merge: true });
      } else {
        await setDoc(itemRef, {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: quantity > product.stock ? product.stock : quantity
        });
      }
    } else {
      setCartItems(currentItems => {
        const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);
        let newCart: CartItem[];
        if (existingItemIndex > -1) {
            newCart = [...currentItems];
            const existingItem = newCart[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            existingItem.quantity = newQuantity > product.stock ? product.stock : newQuantity;
        } else {
            newCart = [...currentItems, {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: quantity > product.stock ? product.stock : quantity,
            }];
        }
        setLocalCart(newCart);
        return newCart;
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await deleteDoc(doc(db, "carts", user.uid, "items", productId));
    } else {
      const updatedCart = cartItems.filter(item => item.productId !== productId);
      setCartItems(updatedCart);
      setLocalCart(updatedCart);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
     if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const productDoc = await getDoc(doc(db, "products", productId));
    const productStock = productDoc.data()?.stock ?? 0;
    const newQuantity = quantity > productStock ? productStock : quantity;

    if (user) {
      await setDoc(doc(db, "carts", user.uid, "items", productId), { quantity: newQuantity }, { merge: true });
    } else {
      const updatedCart = cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      setLocalCart(updatedCart);
    }
  };

  const clearCart = async () => {
    if (user) {
      const cartRef = collection(db, "carts", user.uid, "items");
      const querySnapshot = await getDocs(cartRef);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else {
      setCartItems([]);
      setLocalCart([]);
    }
    setDelivery(false);
    setLocation("");
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    totalPrice,
    loading,
    delivery,
    setDelivery,
    location,
    setLocation,
    deliveryFee,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}