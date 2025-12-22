import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Promotion, Product } from "@/lib/types";
import { PromotionList } from "@/components/admin/promotions/PromotionList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

async function getPromotions(): Promise<Promotion[]> {
  const promotionsCollection = collection(db, "promotions");
  const q = query(promotionsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Promotion;
  });
}

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));
}

export default async function PromotionsPage() {
  const [promotions, products] = await Promise.all([getPromotions(), getProducts()]);

  const productsMap = new Map(products.map(p => [p.id, p.name]));
  const promotionsWithProductNames = promotions.map(promo => ({
    ...promo,
    productName: promo.productId ? productsMap.get(promo.productId) : undefined,
  }));

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
      <PromotionList promotions={promotionsWithProductNames} />
    </div>
  );
}
