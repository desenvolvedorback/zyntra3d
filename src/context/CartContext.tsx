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

  // Monitorar Promoções em tempo real
  useEffect(() => {
    if (!isMounted) return;
    const q = query(collection(db, "promotions"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setDeliveryPromotion(promos.find(p => p.type === 'delivery') || null);
      setProductPromotions(promos.filter(p => p.type === 'product'));
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

  useEffect(() => {
    if (authLoading || !isMounted) return;
    if (user) {
      setLoading(true);
      const cartRef = collection(db, "carts", user.uid, "items");
      const unsubscribe = onSnapshot(cartRef, (snapshot) => {
        setCartItems(snapshot.docs.map(d => d.data() as CartItem));
        setLoading(false);
      }, () => setLoading(false));
      return () => unsubscribe();
    } else {
      const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      setCartItems(localData ? JSON.parse(localData) : []);
      setLoading(false);
    }
  }, [user, authLoading, isMounted]);

  const addToCart = async (product: any, quantity = 1) => {
    if (product.stock === 0) {
      toast({ variant: "destructive", title: "Fora de Estoque" });
      return;
    }
    
    const newItem: CartItem = { 
      productId: product.id,
      name: product.name,
      price: product.price, 
      imageUrl: product.imageUrl,
      quantity,
      category: product.category,
      isDigital: !!product.isDigital,
      digitalLink: product.digitalLink || ""
    };

    if (user) {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      await setDoc(itemRef, newItem, { merge: true });
    } else {
      const newCart = [...cartItems, newItem];
      setCartItems(newCart);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCart));
    }
    toast({ title: "Adicionado ao carrinho!" });
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await deleteDoc(doc(db, "carts", user.uid, "items", productId));
    } else {
      const updated = cartItems.filter(i => i.productId !== productId);
      setCartItems(updated);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (user) {
      await setDoc(doc(db, "carts", user.uid, "items", productId), { quantity }, { merge: true });
    } else {
      const updated = cartItems.map(i => i.productId === productId ? { ...i, quantity } : i);
      setCartItems(updated);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
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
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + (getDiscountedPrice(item) * item.quantity), 0), [cartItems, getDiscountedPrice]);
  const finalDeliveryFee = useMemo(() => {
    if (!deliveryPromotion) return baseDeliveryFee;
    return deliveryPromotion.discountType === 'fixed' ? Math.max(0, baseDeliveryFee - deliveryPromotion.discountValue) : baseDeliveryFee * (1 - deliveryPromotion.discountValue / 100);
  }, [baseDeliveryFee, deliveryPromotion]);

  return <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount: cartItems.length, totalPrice, loading, delivery, setDelivery, location, setLocation, deliveryFee: baseDeliveryFee, finalDeliveryFee, deliveryPromotion, productPromotions, getDiscountedPrice }}>{children}</CartContext.Provider>;
}
