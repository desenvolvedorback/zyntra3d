"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function CartSheet() {
  const { cartItems, cartCount, totalPrice, clearCart, loading } = useCart();

  const handleCheckout = () => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!number) {
      alert("WhatsApp number is not configured.");
      return;
    }
    
    const messageItems = cartItems.map(item => 
      `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
    ).join("\n");

    const message = encodeURIComponent(
`Hello! I'd like to place an order:
---
${messageItems}
---
Total: $${totalPrice.toFixed(2)}`
    );

    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartCount}
            </span>
          )}
          <span className="sr-only">Shopping Cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />

        {loading ? (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-6">
              <div className="flex flex-col divide-y">
                {cartItems.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto">
              <div className="w-full space-y-4">
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Checkout via WhatsApp
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add some sweets to get started!
            </p>
            <SheetClose asChild>
                <Button asChild className="mt-6">
                    <a href="/products">Explore Sweets</a>
                </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
