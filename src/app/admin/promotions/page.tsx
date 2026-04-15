
'use client';

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Promotion, Product, PromotionWithProductName } from "@/lib/types";
import { PromotionList } from "@/components/admin/promotions/PromotionList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionWithProductName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const promotionsCollection = collection(db, "promotions");
        const promoQ = query(promotionsCollection, orderBy("createdAt", "desc"));
        
        const productsCollection = collection(db, "products");
        
        const [promoSnapshot, productSnapshot] = await Promise.all([
          getDocs(promoQ),
          getDocs(productsCollection)
        ]);

        const products = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Product));

        const productsMap = new Map(products.map(p => [p.id, p.name]));

        const promoList = promoSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            productName: data.productId ? productsMap.get(data.productId) : undefined,
          } as PromotionWithProductName;
        });

        setPromotions(promoList);
      } catch (error) {
        console.error("Erro ao buscar promoções:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline text-primary">Gerenciar Promoções</h1>
        <Button asChild>
          <Link href="/admin/promotions/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Promoção
          </Link>
        </Button>
      </div>
      <PromotionList promotions={promotions} />
    </div>
  );
}
