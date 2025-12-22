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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Loader2, ShoppingCart, Trash2, Tag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useContext, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { mercadoPagoCheckout } from "@/lib/actions/mercadoPagoCheckout";

export function CartSheet() {
  const {
    cartItems,
    cartCount,
    totalPrice,
    clearCart,
    loading: cartLoading,
    delivery,
    setDelivery,
    location,
    setLocation,
    deliveryFee,
    finalDeliveryFee,
    deliveryPromotion,
  } = useCart();

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthProvider não encontrado na árvore de componentes.");
  }
  const { user, userProfile, loading: authLoading } = authContext;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const finalPrice = delivery ? totalPrice + finalDeliveryFee : totalPrice;
  const isDeliveryFree = deliveryPromotion && finalDeliveryFee === 0;

  const handleCheckout = () => {
    if (!user || !userProfile) {
      toast({
        variant: "destructive",
        title: "Login Necessário",
        description: "Você precisa estar logado para finalizar a compra.",
      });
      router.push('/login');
      return;
    }

    if (!userProfile?.cpf || !userProfile?.phone) {
        toast({
          variant: "destructive",
          title: "Dados Incompletos",
          description: "Seu perfil precisa ter um CPF e telefone válidos para continuar.",
        });
        router.push('/profile');
        return;
    }

    if (delivery && !location.trim()) {
      toast({
        variant: "destructive",
        title: "Endereço Necessário",
        description: "Por favor, insira o seu endereço para a entrega.",
      });
      return;
    }
    
    startTransition(async () => {
      try {
        const checkoutUrl = await mercadoPagoCheckout({
          items: cartItems.map(item => ({
            ...item,
            // Certifique-se que o preço final com desconto seja enviado
            unit_price: item.price,
          })),
          userProfile,
          deliveryFee: delivery ? finalDeliveryFee : 0,
          location: delivery ? location : "",
        });

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error("URL de checkout não recebida.");
        }
      } catch (error: any) {
        console.error("Erro no checkout:", error);
        toast({
          variant: "destructive",
          title: "Erro no Checkout",
          description: `Falha na comunicação com o Mercado Pago: ${error.message}`,
        });
      }
    });
  }

  if (!isClient) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Carrinho de Compras</span>
      </Button>
    );
  }

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
          <span className="sr-only">Carrinho de Compras</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Seu Carrinho</SheetTitle>
          <SheetDescription>
            Revise seus itens e finalize a compra.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />

        {cartLoading ? (
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delivery-switch" className="flex flex-col gap-1">
                      <span>Adicionar entrega</span>
                       {deliveryPromotion && (
                         <span className="font-normal text-red-600 text-xs flex items-center gap-1">
                           <Tag className="h-3 w-3"/> PROMOÇÃO ATIVA!
                         </span>
                       )}
                       <span className="font-normal text-muted-foreground text-xs">
                         Taxa padrão: R$ {deliveryFee.toFixed(2)}
                       </span>
                    </Label>
                    <Switch
                      id="delivery-switch"
                      checked={delivery}
                      onCheckedChange={setDelivery}
                      disabled={isPending}
                    />
                  </div>

                  {delivery && (
                    <div className="space-y-2">
                      <Label htmlFor="location">Seu Endereço</Label>
                      <Input
                        id="location"
                        placeholder="Rua, Número, Bairro, etc."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>

                  {delivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de Entrega</span>
                       {deliveryPromotion ? (
                         <div className="flex items-baseline gap-2">
                           <span className="text-red-600 font-bold">R$ {finalDeliveryFee.toFixed(2)}</span>
                           <span className="text-muted-foreground line-through text-xs">R$ {deliveryFee.toFixed(2)}</span>
                         </div>
                       ) : (
                         <span>R$ {deliveryFee.toFixed(2)}</span>
                       )}
                    </div>
                  )}

                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPending || authLoading}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2" />
                      Pagar com Mercado Pago
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="w-full" onClick={clearCart} disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" /> Limpar Carrinho
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Seu carrinho está vazio</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Adicione alguns doces para começar!
            </p>
            <SheetClose asChild>
              <Button asChild className="mt-6">
                <a href="/products">Explorar Doces</a>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
