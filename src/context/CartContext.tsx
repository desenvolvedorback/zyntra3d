
"use client";

import React, { createContext, useCallback, useEffect, useState, useContext, useMemo, type ReactNode } from "react";
import type { Product, CartItem, Promotion } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
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
  finalDeliveryFee: number;
  deliveryPromotion: Promotion | null;
  productPromotions: Promotion[];
  getDiscountedPrice: (item: CartItem) => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  // Durante o SSR do Next.js 15, o contexto pode ser undefined. 
  // Retornamos undefined em vez de estourar erro para permitir hidratação segura.
  return context;
};

const LOCAL_STORAGE_KEY = "zyntra_3d_cart_v5";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [delivery, setDelivery] = useState(false);
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const [deliveryPromotion, setDeliveryPromotion] = useState<Promotion | null>(null);
  const [productPromotions, setProductPromotions] = useState<Promotion[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  const baseDeliveryFee = 10;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitorar Promoções de Entrega
  useEffect(() => {
    if (!isMounted) return;
    const q = query(
      collection(db, "promotions"), 
      where("isActive", "==", true), 
      where("type", "==", "delivery")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setDeliveryPromotion(promos[0]);
      } else {
        setDeliveryPromotion(null);
      }
    });
    return () => unsubscribe();
  }, [isMounted]);

  // Monitorar Promoções de Produtos
  useEffect(() => {
    if (!isMounted) return;
    const q = query(
      collection(db, "promotions"), 
      where("isActive", "==", true), 
      where("type", "==", "product")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProductPromotions(promos);
    });
    return () => unsubscribe();
  }, [isMounted]);

  const getDiscountedPrice = useCallback((item: CartItem) => {
    const promo = productPromotions.find(p => p.productId === item.productId);
    if (!promo) return item.price;

    if (promo.discountType === 'percentage') {
      return item.price * (1 - promo.discountValue / 100);
    } else {
      return Math.max(0, item.price - promo.discountValue);
    }
  }, [productPromotions]);

  const getLocalCart = useCallback((): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  }, []);

  const setLocalCart = useCallback((items: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {}
  }, []);

  const mergeAndClearLocalCart = useCallback(async (userId: string) => {
    const localCart = getLocalCart();
    if (localCart.length === 0) return;

    const cartRef = collection(db, "carts", userId, "items");
    const batch = writeBatch(db);

    for (const localItem of localCart) {
        const itemRef = doc(cartRef, localItem.productId);
        batch.set(itemRef, localItem, { merge: true });
    }

    await batch.commit();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [getLocalCart]);

  useEffect(() => {
    if (authLoading || !isMounted) return;

    if (user) {
      setLoading(true);
      mergeAndClearLocalCart(user.uid).then(() => {
        const cartRef = collection(db, "carts", user.uid, "items");
        const unsubscribe = onSnapshot(cartRef, (snapshot) => {
          const cloudItems = snapshot.docs.map(d => d.data() as CartItem);
          setCartItems(cloudItems);
          setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
      });
    } else {
      setCartItems(getLocalCart());
      setLoading(false);
    }
  }, [user, authLoading, isMounted, getLocalCart, mergeAndClearLocalCart]);

  const addToCart = async (product: any, quantity = 1) => {
    if (product.stock === 0) {
      toast({ variant: "destructive", title: "Fora de Estoque", description: `${product.name} não está disponível.` });
      return;
    }
    
    const basePrice = product.price;

    const newItem: CartItem = { 
      productId: product.id,
      name: product.name,
      price: basePrice, 
      imageUrl: product.imageUrl,
      quantity,
      category: product.category,
      isDigital: !!product.isDigital,
      digitalLink: product.digitalLink || ""
    };

    if (user) {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      const docSnap = await getDoc(itemRef);
      const existingQuantity = docSnap.exists() ? (docSnap.data() as CartItem).quantity : 0;
      newItem.quantity = existingQuantity + quantity;
      await setDoc(itemRef, newItem, { merge: true });
    } else {
      const currentItems = getLocalCart();
      const existingItem = currentItems.find(item => item.productId === product.id);
      let newCart: CartItem[];
      
      if (existingItem) {
        newCart = currentItems.map(item => item.productId === product.id ? {...item, quantity: item.quantity + quantity} : item);
      } else {
        newCart = [...currentItems, newItem];
      }
      setLocalCart(newCart);
      setCartItems(newCart);
    }
    
    toast({ title: "Adicionado!", description: `${product.name} está no seu carrinho.` });
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

    if (user) {
      await setDoc(doc(db, "carts", user.uid, "items", productId), { quantity }, { merge: true });
    } else {
      const updatedCart = cartItems.map(item => item.productId === productId ? { ...item, quantity } : item);
      setCartItems(updatedCart);
      setLocalCart(updatedCart);
    }
  };

  const clearCart = async () => {
    if (user) {
      const cartRef = collection(db, "carts", user.uid, "items");
      const snapshot = await getDocs(cartRef);
      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } else {
      setCartItems([]);
      setLocalCart([]);
    }
    setDelivery(false);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (getDiscountedPrice(item) * item.quantity), 0);
  }, [cartItems, getDiscountedPrice]);

  const finalDeliveryFee = useMemo(() => {
    if (!deliveryPromotion) return baseDeliveryFee;
    if (deliveryPromotion.discountType === 'fixed') {
      return Math.max(0, baseDeliveryFee - deliveryPromotion.discountValue);
    }
    return baseDeliveryFee * (1 - deliveryPromotion.discountValue / 100);
  }, [baseDeliveryFee, deliveryPromotion]);

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
    deliveryFee: baseDeliveryFee,
    finalDeliveryFee,
    deliveryPromotion,
    productPromotions,
    getDiscountedPrice
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
