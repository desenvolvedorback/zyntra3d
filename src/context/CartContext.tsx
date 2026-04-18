
"use client";

import type { Product, CartItem, Promotion } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch, query, where, orderBy } from "firebase/firestore";
import { createContext, useCallback, useEffect, useState, useContext, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { applyPromotions } from "@/lib/promotions";

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
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const LOCAL_STORAGE_KEY = "zyntra_3d_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const [delivery, setDelivery] = useState(false);
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const deliveryFee = 10;
  const [deliveryPromotion, setDeliveryPromotion] = useState<Promotion | null>(null);

  const getLocalCart = useCallback((): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  }, []);

  const setLocalCart = useCallback((cartItems: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {}
  }, []);

  useEffect(() => {
    const fetchDeliveryPromo = async () => {
      const promoQuery = query(
        collection(db, "promotions"), 
        where("isActive", "==", true), 
        where("type", "==", "delivery")
      );
      try {
        const promoSnapshot = await getDocs(promoQuery);
        if (!promoSnapshot.empty) {
          const promos = promoSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return { 
                id: doc.id, 
                name: data.name,
                type: data.type,
                discountType: data.discountType,
                discountValue: data.discountValue,
                isActive: data.isActive,
                createdAt: data.createdAt?.toDate() || new Date()
              } as Promotion;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          setDeliveryPromotion(promos[0]);
        } else {
          setDeliveryPromotion(null);
        }
      } catch (error) {
        setDeliveryPromotion(null);
      }
    };

    const promoCollectionRef = collection(db, "promotions");
    const unsubscribe = onSnapshot(promoCollectionRef, () => {
        fetchDeliveryPromo();
    });

    return () => unsubscribe();
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
    if (authLoading) return;

    if (user) {
      setLoading(true);
      mergeAndClearLocalCart(user.uid).then(() => {
        const cartRef = collection(db, "carts", user.uid, "items");
        const unsubscribe = onSnapshot(cartRef, (snapshot) => {
          const cloudItems = snapshot.docs.map(d => d.data() as CartItem);
          setCartItems(cloudItems);
          setLoading(false);
        });
        return () => unsubscribe();
      });
    } else {
      setCartItems(getLocalCart());
      setLoading(false);
    }
  }, [user, authLoading, getLocalCart, mergeAndClearLocalCart]);


  const addToCart = async (product: any, quantity = 1) => {
    if (product.stock === 0) {
      toast({ variant: "destructive", title: "Fora de Estoque", description: `${product.name} não está disponível.` });
      return;
    }
    
    const finalPrice = product.promotionalPrice ?? product.price;

    if (user) {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      const docSnap = await getDoc(itemRef);
      const existingQuantity = docSnap.exists() ? (docSnap.data() as CartItem).quantity : 0;
      const newQuantity = existingQuantity + quantity;

      await setDoc(itemRef, { 
        productId: product.id,
        name: product.name,
        price: finalPrice,
        imageUrl: product.imageUrl,
        quantity: newQuantity 
      }, { merge: true });

    } else {
      const currentItems = getLocalCart();
      const existingItem = currentItems.find(item => item.productId === product.id);
      let newCart: CartItem[];
      
      if (existingItem) {
        newCart = currentItems.map(item => item.productId === product.id ? {...item, quantity: item.quantity + quantity} : item);
      } else {
        newCart = [...currentItems, { productId: product.id, name: product.name, price: finalPrice, imageUrl: product.imageUrl, quantity }];
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
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const finalDeliveryFee = deliveryPromotion ? 
    (deliveryPromotion.discountType === 'fixed' ? Math.max(0, deliveryFee - deliveryPromotion.discountValue) : deliveryFee * (1 - deliveryPromotion.discountValue/100)) : 
    deliveryFee;

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
    finalDeliveryFee,
    deliveryPromotion,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
