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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Loader2, ShoppingCart, Trash2, Tag, CalendarDays, Info } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useContext, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { mercadoPagoCheckout } from "@/lib/actions/mercadoPagoCheckout";
import { formatInTimeZone } from "date-fns-tz";

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

  // Novos campos logísticos
  const [deliverySlot, setDeliverySlot] = useState<'morning' | 'afternoon'>('morning');
  const [observation, setObservation] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthProvider não encontrado na árvore de componentes.");
  }
  const { user, userProfile, loading: authLoading } = authContext;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Verificar se hoje é domingo
  const isSunday = new Date().getDay() === 0;

  const finalPrice = delivery ? totalPrice + finalDeliveryFee : totalPrice;

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
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          userProfile,
          deliveryFee: delivery ? finalDeliveryFee : 0,
          location: delivery ? location : "",
          deliverySlot: delivery ? deliverySlot : undefined,
          observation: observation,
          contactPhone: contactPhone,
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
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
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
            <ScrollArea className="flex-grow pr-4">
              <div className="flex flex-col divide-y">
                {cartItems.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
              
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delivery-switch" className="flex flex-col gap-1">
                      <span className="font-bold">Adicionar entrega</span>
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
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="location">Endereço de Entrega</Label>
                        <Input
                          id="location"
                          placeholder="Rua, Número, Bairro, etc."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          Janela de Entrega
                        </Label>
                        
                        {isSunday && (
                          <div className="flex gap-2 items-start p-2 bg-amber-100 border border-amber-200 rounded text-amber-900 text-xs mb-2">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p><strong>Aviso:</strong> Pedidos feitos no domingo são entregues na segunda-feira.</p>
                          </div>
                        )}

                        <RadioGroup 
                          value={deliverySlot} 
                          onValueChange={(val) => setDeliverySlot(val as 'morning' | 'afternoon')}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="morning" id="morning" />
                            <Label htmlFor="morning" className="font-normal cursor-pointer">Manhã (11:00)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="afternoon" id="afternoon" />
                            <Label htmlFor="afternoon" className="font-normal cursor-pointer">Tarde (17:00)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Telefone para Contato (Opcional)</Label>
                        <Input
                          id="contactPhone"
                          placeholder="(00) 00000-0000"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">Observações para o Pedido</Label>
                  <Textarea
                    id="observation"
                    placeholder="Ex: Ponto de referência, tirar cebola, etc."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    disabled={isPending}
                    rows={2}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t pt-4 bg-background">
              <div className="w-full space-y-4">
                <div className="space-y-2">
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

                  <div className="flex justify-between items-center font-bold text-xl pt-2">
                    <span>Total</span>
                    <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  className="w-full h-12 text-lg font-bold"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPending || authLoading}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar com Mercado Pago
                    </>
                  )}
                </Button>
                
                <Button variant="ghost" className="w-full text-muted-foreground" size="sm" onClick={clearCart} disabled={isPending}>
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
