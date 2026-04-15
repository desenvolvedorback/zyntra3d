
'use client';

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Promotion } from "@/lib/types";
import Image from "next/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { applyPromotions } from "@/lib/promotions";
import { Share2, Printer, Box, ShieldCheck, Truck, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const prodData = { 
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          } as Product;

          const promoQuery = query(collection(db, "promotions"), where("isActive", "==", true), where("productId", "==", id));
          const promoSnapshot = await getDocs(promoQuery);
          const promotions = promoSnapshot.docs.map(doc => doc.data() as Promotion);

          const processed = applyPromotions([prodData], promotions)[0];
          setProduct(processed);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Zyntra 3D - ${product?.name}`,
          text: `Confira este projeto 3D na Zyntra 3D!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share failed");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copiado!", description: "Link do projeto copiado para a área de transferência." });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!product) return <div className="container py-20 text-center">Projeto não encontrado.</div>;

  return (
    <div className="container mx-auto max-w-6xl py-12 md:py-20 px-6">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 shadow-2xl group">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority
              data-ai-hint={product.imageHint || product.category}
            />
            {product.promotion && (
              <div className="absolute top-4 left-4 bg-accent text-white px-4 py-1.5 text-xs font-bold rounded-full shadow-lg">
                PROMOÇÃO LIMITADA
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-secondary/30 p-4 rounded-xl border border-white/5 text-center">
                <Printer className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Alta Precisão</p>
             </div>
             <div className="bg-secondary/30 p-4 rounded-xl border border-white/5 text-center">
                <Box className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Material Pro</p>
             </div>
             <div className="bg-secondary/30 p-4 rounded-xl border border-white/5 text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Garantia Zyntra</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-accent font-bold uppercase tracking-widest px-3 py-1 bg-accent/10 rounded-full">{product.category}</span>
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-primary">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-headline text-primary mb-6 leading-tight">{product.name}</h1>
          
          <div className="flex items-baseline gap-4 mb-8">
            {product.promotion ? (
              <>
                <span className="text-4xl font-bold text-foreground">R$ {product.promotionalPrice?.toFixed(2)}</span>
                <span className="text-xl text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-4xl font-bold text-foreground">R$ {product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-muted-foreground font-alegreya text-lg leading-relaxed mb-8 border-l-2 border-primary/20 pl-6 italic">
            {product.description}
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-green-500 font-bold">
              <Truck className="h-5 w-5" /> Entrega inteligente via Zyntra Logística
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-destructive font-bold text-sm bg-destructive/10 p-2 rounded inline-block">⏳ ÚLTIMAS {product.stock} UNIDADES EM ESTOQUE!</p>
            )}
          </div>

          <div className="mt-auto">
            <AddToCartButton 
              product={{
                ...product,
                price: product.promotionalPrice || product.price,
              }}
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> Compra 100% Protegida
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Package className="h-4 w-4 text-primary" /> Embalagem Anti-Impacto
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Segurança Verificada:</p>
              <a href="https://zyntra-scan.onrender.com" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
                <img src="https://img.shields.io/badge/Analisado%20com-Zyntra%20Scan-0c4a6e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3ZGQzZmMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PC9zdmc+" alt="Analisado com Zyntra Scan" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
