"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/lib/types";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";


interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  

  const handleAddToCart = () => {
    setLoading(true);
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        category: product.category,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAddToCart} 
      disabled={loading || product.stock === 0} 
      className="w-full"
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
         {product.stock > 0 ? <ShoppingCart className="mr-2" /> : null}
         {product.stock > 0 ? "Adicionar ao Carrinho" : "Fora de Estoque"}
        </>
      )}
    </Button>
  );
}
