"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Promotion } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { applyPromotions } from "@/lib/promotions";

async function getProducts(): Promise<Product[]> {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdAt", "desc"));
    const productSnapshot = await getDocs(q);
    const products = productSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Product;
    });

    const promotionsCollection = collection(db, "promotions");
    const promoQuery = query(promotionsCollection, where("isActive", "==", true));
    const promoSnapshot = await getDocs(promoQuery);
    const promotions = promoSnapshot.docs.map(doc => doc.data() as Promotion);
    
    return applyPromotions(products, promotions);

  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderSkeletons = () => (
    Array.from({ length: 8 }).map((_, i) => (
      <Card key={i} className="overflow-hidden group flex flex-col">
        <CardHeader className="p-0">
          <Skeleton className="h-[250px] w-full" />
        </CardHeader>
        <CardContent className="p-6 flex flex-col flex-grow">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4 mt-2" />
          <div className="mt-auto pt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl md:text-5xl font-headline text-center text-primary mb-4">
        Nossa Doce Coleção
      </h1>
      <p className="text-center text-muted-foreground mb-12">
        Explore nossos doces artesanais, feitos com amor e os melhores ingredientes.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Buscar pelo nome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category, index) => (
              <SelectItem key={`${category}-${index}`} value={category} className="capitalize">
                {category === 'all' ? 'Todas as Categorias' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {renderSkeletons()}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
             <Card key={product.id} className="overflow-hidden group flex flex-col relative">
               {product.promotion && (
                 <div className="absolute top-2 -right-11 z-10">
                   <div className="w-48 text-center text-sm font-bold text-white bg-red-600 py-1 transform rotate-45">
                     PROMOÇÃO
                   </div>
                 </div>
               )}
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
                <div className="text-lg font-bold mt-2 flex items-baseline gap-2">
                  {product.promotion ? (
                    <>
                      <span className="text-red-600">R${product.promotionalPrice?.toFixed(2)}</span>
                      <span className="text-muted-foreground line-through text-sm">R${product.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">R${product.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  <AddToCartButton 
                    product={{
                      ...product,
                      price: product.promotionalPrice || product.price,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-muted-foreground">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">Tente ajustar sua busca ou filtro.</p>
        </div>
      )}
    </div>
  );
}
