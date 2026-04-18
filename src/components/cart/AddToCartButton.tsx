
"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        isDigital: product.isDigital,
        digitalLink: product.digitalLink,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <Button disabled className="w-full">
        Carregando...
      </Button>
    );
  }

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
         {product.stock > 0 ? <ShoppingCart className="mr-2 h-4 w-4" /> : null}
         {product.stock > 0 ? "Adicionar ao Carrinho" : "Fora de Estoque"}
        </>
      )}
    </Button>
  );
}
