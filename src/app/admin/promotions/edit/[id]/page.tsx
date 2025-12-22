import { doc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import type { Promotion, Product } from "@/lib/types";

async function getPromotion(id: string) {
  const docRef = doc(db, "promotions", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
    } as Promotion;
  }
  return null;
}

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, orderBy("name", "asc"));
  const productSnapshot = await getDocs(q);
  return productSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));
}

export default async function EditPromotionPage({ params }: { params: { id: string } }) {
  const [promotion, products] = await Promise.all([
    getPromotion(params.id),
    getProducts()
  ]);

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
