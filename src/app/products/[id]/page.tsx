import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id,
        ...data,
      } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return <div className="container py-12">Produto não encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-lg shadow-lg"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-headline text-primary">{product.name}</h1>
          <p className="text-2xl font-bold text-muted-foreground mt-2">R${product.price.toFixed(2)}</p>
          <p className="mt-6 text-foreground/80 leading-relaxed font-alegreya text-lg">{product.description}</p>
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
          {product.stock <= 5 && product.stock > 0 && (
             <p className="text-destructive text-sm mt-4">Apenas {product.stock} em estoque!</p>
          )}
           {product.stock === 0 && (
             <p className="text-destructive text-sm mt-4">Fora de estoque</p>
          )}
        </div>
      </div>
    </div>
  );
}
