'use client';

import { doc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import type { Promotion, Product } from "@/lib/types";
import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "promotions", id);
        const productsCollection = collection(db, "products");
        const q = query(productsCollection, orderBy("name", "asc"));
        
        const [docSnap, productSnapshot] = await Promise.all([
          getDoc(docRef),
          getDocs(q)
        ]);

        if (docSnap.exists()) {
          setPromotion({ id: docSnap.id, ...docSnap.data() } as Promotion);
        }

        const productList = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Product));
        setProducts(productList);

      } catch (error) {
        console.error("Error fetching promotion data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promotion) {
    return <div>Promoção não encontrada.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Editar Promoção</h1>
      <PromotionForm initialData={promotion} products={products} />
    </div>
  );
}
