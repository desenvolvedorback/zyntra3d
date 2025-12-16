import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { Product } from "@/lib/types";

async function getProduct(id: string) {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return { 
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Product;
  }
  return null;
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return <div>Produto não encontrado.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Editar Produto</h1>
      <ProductForm initialData={product} />
    </div>
  );
}
