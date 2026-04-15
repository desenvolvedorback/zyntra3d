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
import { Loader2, Search } from "lucide-react";

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
      <Card key={i} className="overflow-hidden bg-secondary/20 border-white/5 flex flex-col">
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
    <div className="container mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-4">
          Catálogo Zyntra 3D
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore nossa coleção de modelos exclusivos, arquivos digitais e soluções personalizadas em manufatura aditiva.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-secondary/30 p-4 rounded-xl border border-white/5">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[250px] bg-background/50">
            <SelectValue placeholder="Filtrar Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category, index) => (
              <SelectItem key={`${category}-${index}`} value={category} className="capitalize">
                {category === 'all' ? 'Todos os Projetos' : category}
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
             <Card key={product.id} className="overflow-hidden bg-secondary/30 border-white/5 flex flex-col relative group transition-all hover:border-primary/50">
               {product.promotion && (
                 <div className="absolute top-4 left-4 z-10">
                   <Badge className="bg-accent text-white font-bold">PROMOÇÃO</Badge>
                 </div>
               )}
              <CardHeader className="p-0">
                <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    data-ai-hint={product.category}
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{product.category}</span>
                </div>
                <CardTitle className="font-headline text-2xl text-primary h-14 line-clamp-2">
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                </CardTitle>
                <div className="text-xl font-bold mt-4 flex items-baseline gap-2">
                  {product.promotion ? (
                    <>
                      <span className="text-foreground">R$ {product.promotionalPrice?.toFixed(2)}</span>
                      <span className="text-muted-foreground line-through text-xs">R$ {product.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-foreground">R$ {product.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="mt-auto pt-6">
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
        <div className="text-center py-24 bg-secondary/10 rounded-2xl border border-dashed border-white/10">
          <p className="text-xl font-semibold text-muted-foreground">Nenhum projeto encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">Tente ajustar sua busca ou filtro para o Zyntra 3D.</p>
        </div>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
