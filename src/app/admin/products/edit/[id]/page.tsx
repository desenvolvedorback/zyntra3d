'use client';

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { Product } from "@/lib/types";
import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProduct() {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ 
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Product);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
