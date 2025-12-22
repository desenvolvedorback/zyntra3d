import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Promotion } from "@/lib/types";
import Image from "next/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { applyPromotions } from "@/lib/promotions";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const product = { 
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
      } as Product;

      const promotionsCollection = collection(db, "promotions");
      const promoQuery = query(promotionsCollection, where("isActive", "==", true), where("productId", "==", product.id));
      const promoSnapshot = await getDocs(promoQuery);
      const promotions = promoSnapshot.docs.map(doc => doc.data() as Promotion);

      return applyPromotions([product], promotions)[0];
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
        <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
          {product.promotion && (
            <div className="absolute top-3 -right-12 z-20">
              <div className="w-52 text-center text-base font-bold text-white bg-red-600 py-1.5 transform rotate-45">
                PROMOÇÃO
              </div>
            </div>
          )}
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-headline text-primary">{product.name}</h1>
          <div className="text-2xl font-bold mt-2 flex items-baseline gap-3">
              {product.promotion ? (
                <>
                  <span className="text-red-600 text-3xl">R${product.promotionalPrice?.toFixed(2)}</span>
                  <span className="text-muted-foreground line-through">R${product.price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">R${product.price.toFixed(2)}</span>
              )}
            </div>
          <p className="mt-6 text-foreground/80 leading-relaxed font-alegreya text-lg">{product.description}</p>
          <div className="mt-8">
            <AddToCartButton 
              product={{
                ...product,
                price: product.promotionalPrice || product.price,
              }}
            />
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
