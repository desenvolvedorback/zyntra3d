import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, orderBy("name", "asc"));
  const productSnapshot = await getDocs(q);
  return productSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));
}

export default async function NewPromotionPage() {
  const products = await getProducts();
  
  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Adicionar Nova Promoção</h1>
      <PromotionForm products={products} />
    </div>
  );
}
