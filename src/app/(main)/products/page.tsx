import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

async function getProducts(): Promise<Product[]> {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdAt", "desc"));
    const productSnapshot = await getDocs(q);
    return productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl md:text-5xl font-headline text-center text-primary mb-12">
        Our Sweet Collection
      </h1>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group flex flex-col">
              <CardHeader className="p-0">
                <Link href={`/products/${product.id}`} className="block relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={product.imageHint}
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <CardTitle className="font-headline text-2xl text-primary h-16">
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                </CardTitle>
                <p className="text-muted-foreground mt-2 text-lg font-bold">${product.price.toFixed(2)}</p>
                <div className="mt-auto pt-4">
                  <AddToCartButton product={product} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Our sweets are being baked! Please check back soon.</p>
      )}
    </div>
  );
}
