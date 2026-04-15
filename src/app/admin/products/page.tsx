
'use client';

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";
import { ProductList } from "@/components/admin/products/ProductList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsCollection = collection(db, "products");
        const q = query(productsCollection, orderBy("createdAt", "desc"));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Product;
        });
        setProducts(productList);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline text-primary">Gerenciar Produtos</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
          </Link>
        </Button>
      </div>
      <ProductList products={products} />
    </div>
  );
}
