"use client";

import type { Product, CartItem, Promotion } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch, query, where } from "firebase/firestore";
import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { applyPromotions } from "@/lib/promotions";

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
  deliveryPromotion: Promotion | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "docelink_cart";

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

  // Fetch delivery promotion
  useEffect(() => {
    const fetchDeliveryPromo = async () => {
      const promoQuery = query(
        collection(db, "promotions"), 
        where("isActive", "==", true), 
        where("type", "==", "delivery")
      );
      const promoSnapshot = await getDocs(promoQuery);
      if (!promoSnapshot.empty) {
        const promo = promoSnapshot.docs[0].data() as Promotion;
        if (promo.discountType === 'fixed' && promo.discountValue >= deliveryFee) {
          setDeliveryPromotion(promo);
        } else if (promo.discountType === 'percentage' && promo.discountValue >= 100) {
          setDeliveryPromotion(promo);
        }
      } else {
        setDeliveryPromotion(null);
      }
    };
    fetchDeliveryPromo();
  }, []);

  const mergeAndClearLocalCart = useCallback(async (userId: string) => {
    const localCart = getLocalCart();
    if (localCart.length === 0) return;

    const cartRef = collection(db, "carts", userId, "items");
    const remoteSnapshot = await getDocs(cartRef);
    const remoteItems = new Map(remoteSnapshot.docs.map(d => [d.id, d.data() as CartItem]));

    const batch = writeBatch(db);

    for (const localItem of localCart) {
        const productRef = doc(db, "products", localItem.productId);
        const productSnap = await getDoc(productRef);
        const stock = productSnap.data()?.stock ?? 0;

        const remoteItem = remoteItems.get(localItem.productId);
        let newQuantity = localItem.quantity;
        if (remoteItem) {
            newQuantity += remoteItem.quantity;
        }

        const finalQuantity = Math.min(newQuantity, stock);

        if (finalQuantity > 0) {
            const itemPayload = { ...localItem, quantity: finalQuantity };
            if (remoteItem) {
                batch.update(doc(cartRef, localItem.productId), { quantity: finalQuantity });
            } else {
                batch.set(doc(cartRef, localItem.productId), itemPayload);
            }
        }
    }

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
        const unsubscribe = onSnapshot(cartRef, async (snapshot) => {
          const cloudItems = snapshot.docs.map(d => d.data() as CartItem);
          
          if (cloudItems.length > 0) {
            const productIds = cloudItems.map(item => item.productId);
            const productsQuery = query(collection(db, "products"), where("__name__", "in", productIds));
            const promotionsQuery = query(collection(db, "promotions"), where("isActive", "==", true));
            
            const [productsSnapshot, promotionsSnapshot] = await Promise.all([
              getDocs(productsQuery),
              getDocs(promotionsQuery)
            ]);

            const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            const promotionsData = promotionsSnapshot.docs.map(doc => doc.data() as Promotion);
            
            const productsWithPromos = applyPromotions(productsData, promotionsData);
            const productMap = new Map(productsWithPromos.map(p => [p.id, p]));

            const updatedCartItems = cloudItems.map(item => {
              const product = productMap.get(item.productId);
              return {
                ...item,
                price: product?.promotionalPrice ?? product?.price ?? item.price,
              };
            });
            setCartItems(updatedCartItems);
          } else {
            setCartItems([]);
          }

          setLoading(false);
        }, (error) => {
            console.error("Error with cart snapshot:", error)
            setLoading(false);
        });
        return () => unsubscribe();
      });
    } else {
      // Local cart logic needs to handle promotions too for consistency, but it's more complex.
      // For now, local cart will show original prices.
      setCartItems(getLocalCart());
      setLoading(false);
    }
  }, [user, authLoading, getLocalCart, mergeAndClearLocalCart]);


  const addToCart = async (product: Omit<Product, 'description' | 'imageHint' | 'createdAt'>, quantity = 1) => {
    if (product.stock === 0) {
      toast({ variant: "destructive", title: "Fora de Estoque", description: `${product.name} não está mais disponível.` });
      return;
    }
    
    // Use promotional price if available
    const finalPrice = product.promotionalPrice ?? product.price;

    if (user) {
      const itemRef = doc(db, "carts", user.uid, "items", product.id);
      const docSnap = await getDoc(itemRef);
      const existingQuantity = docSnap.exists() ? (docSnap.data() as CartItem).quantity : 0;
      const newQuantity = existingQuantity + quantity;

      if (newQuantity > product.stock) {
        toast({ variant: "destructive", title: "Estoque Limitado", description: `Você só pode adicionar ${product.stock - existingQuantity} mais unidade(s) de ${product.name}.` });
        return;
      }

      await setDoc(itemRef, { 
        productId: product.id,
        name: product.name,
        price: finalPrice, // Use final price
        imageUrl: product.imageUrl,
        quantity: newQuantity 
      }, { merge: true });

    } else { // Local cart logic
      setCartItems(currentItems => {
        const existingItem = currentItems.find(item => item.productId === product.id);
        const existingQuantity = existingItem ? existingItem.quantity : 0;
        const newQuantity = existingQuantity + quantity;

        if (newQuantity > product.stock) {
          toast({ variant: "destructive", title: "Estoque Limitado", description: `Você só pode adicionar ${product.stock - existingQuantity} mais unidade(s) de ${product.name}.` });
          return currentItems; // Do not update cart
        }

        let newCart: CartItem[];
        if (existingItem) {
            newCart = currentItems.map(item => item.productId === product.id ? {...item, quantity: newQuantity, price: finalPrice} : item);
        } else {
            newCart = [...currentItems, {
                productId: product.id,
                name: product.name,
                price: finalPrice,
                imageUrl: product.imageUrl,
                quantity: quantity,
            }];
        }
        setLocalCart(newCart);
        return newCart;
      });
    }
      toast({
        title: "Adicionado ao carrinho!",
        description: `${product.name} está agora no seu carrinho.`,
      });
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

    if (quantity > productStock) {
        toast({
            variant: "destructive",
            title: "Estoque Insuficiente",
            description: `Apenas ${productStock} unidades disponíveis.`,
        });
    }

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
    deliveryPromotion,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
