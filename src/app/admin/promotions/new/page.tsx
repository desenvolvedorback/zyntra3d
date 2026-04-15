'use client';

import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function NewPromotionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsCollection = collection(db, "products");
        const q = query(productsCollection, orderBy("name", "asc"));
        const productSnapshot = await getDocs(q);
        const list = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Product));
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products for promotion:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Adicionar Nova Promoção</h1>
      <PromotionForm products={products} />
    </div>
  );
}
