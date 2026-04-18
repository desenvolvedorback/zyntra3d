"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, getDiscountedPrice } = useCart();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity)) {
      updateQuantity(item.productId, newQuantity);
    }
  };

  const discountedPrice = getDiscountedPrice(item);
  const hasDiscount = discountedPrice < item.price;

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-white/5">
        <Image 
          src={item.imageUrl} 
          alt={item.name} 
          fill 
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="flex-grow">
        <h4 className="font-semibold text-primary line-clamp-1">{item.name}</h4>
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <p className="text-sm font-bold text-accent">R${discountedPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground line-through opacity-50">R${item.price.toFixed(2)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">R${item.price.toFixed(2)}</p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={`quantity-${item.productId}`} className="sr-only">
            Quantidade
          </label>
          <Input
            id={`quantity-${item.productId}`}
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="h-8 w-16 bg-background/50 border-white/10"
          />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            {item.isDigital ? "Digital" : "Físico"}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">R${(discountedPrice * item.quantity).toFixed(2)}</p>
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => removeFromCart(item.productId)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remover item</span>
        </Button>
      </div>
    </div>
  );
}