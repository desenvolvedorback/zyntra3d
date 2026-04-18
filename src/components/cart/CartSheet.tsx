
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
import { CreditCard, Loader2, ShoppingCart, Trash2, Link as LinkIcon, Truck, Box } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CartItem } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { mercadoPagoCheckout } from "@/lib/actions/mercadoPagoCheckout";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, setDoc, serverTimestamp } from "firebase/firestore";

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
    finalDeliveryFee,
    getDiscountedPrice
  } = useCart();

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [fileLink, setFileLink] = useState("");
  const [observation, setObservation] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => setIsClient(true), []);

  const computedDeliveryFee = useMemo(() => {
    if (!delivery) return 0;
    // Se o usuário informar KM, o cálculo é dinâmico, senão usa a taxa fixa da promoção
    const baseKmFee = distanceKm <= 5 ? 0 : distanceKm * 1.5;
    return distanceKm > 0 ? baseKmFee : finalDeliveryFee;
  }, [delivery, distanceKm, finalDeliveryFee]);

  const finalPrice = totalPrice + computedDeliveryFee;

  const hasPersonalized = cartItems.some(item => 
    item.category === 'Personalizados' || item.category === 'Logotipos'
  );

  const hasPhysicalItems = cartItems.some(item => !item.isDigital);

  const getNextOrderNumber = async (): Promise<number> => {
    const counterRef = doc(db, "counters", "orderCounter");
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextNumber;
      if (!counterDoc.exists()) {
        nextNumber = 1001;
        transaction.set(counterRef, { lastNumber: nextNumber });
      } else {
        const lastNumber = counterDoc.data().lastNumber || 1000;
        nextNumber = lastNumber + 1;
        transaction.update(counterRef, { lastNumber: nextNumber });
      }
      return nextNumber;
    });
  };

  const handleCheckout = async () => {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Acesso Maker", description: "Entre na sua conta para finalizar o pedido." });
      router.push('/login');
      return;
    }

    if (hasPhysicalItems && delivery && !location.trim()) {
      toast({ variant: "destructive", title: "Endereço de Entrega", description: "Informe onde devemos entregar sua peça." });
      return;
    }

    if (hasPersonalized && !fileLink.trim()) {
      toast({ variant: "destructive", title: "Arquivo do Projeto", description: "Precisamos do link do seu arquivo 3D para modelar." });
      return;
    }
    
    startTransition(async () => {
      try {
        const orderNumber = await getNextOrderNumber();
        const orderRef = doc(collection(db, "orders"));

        const orderPayload = {
          orderNumber,
          status: 'pending',
          total: finalPrice,
          items: cartItems.map(item => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unit_price: getDiscountedPrice(item),
            isDigital: !!item.isDigital,
            digitalLink: item.digitalLink || "",
          })),
          customer: {
            id: userProfile.uid,
            name: userProfile.displayName || "Usuário Zyntra",
            email: userProfile.email || "cliente@zyntra.com",
          },
          delivery: hasPhysicalItems && delivery,
          deliveryFee: hasPhysicalItems && delivery ? computedDeliveryFee : 0,
          location: hasPhysicalItems && delivery ? location : (hasPhysicalItems ? 'Retirada Unidade Botucatu' : 'Entrega Digital'),
          observation: observation,
          fileLink: fileLink,
          contactPhone: contactPhone || userProfile.phone || '',
          createdAt: serverTimestamp(),
          paymentId: null,
        };

        await setDoc(orderRef, orderPayload);

        const checkoutUrl = await mercadoPagoCheckout({
          items: orderPayload.items.map(i => ({
            id: i.id,
            title: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price
          })),
          userProfile,
          deliveryFee: orderPayload.deliveryFee,
          location: orderPayload.location,
          orderId: orderRef.id,
          orderNumber: orderNumber,
          observation: observation,
          contactPhone: orderPayload.contactPhone,
        });

        if (checkoutUrl) window.location.href = checkoutUrl;
      } catch (error: any) {
        toast({ variant: "destructive", title: "Falha na Produção", description: "Não conseguimos iniciar o checkout. Tente novamente." });
      }
    });
  }

  if (!isClient) return <Button variant="ghost" size="icon"><ShoppingCart className="h-5 w-5" /></Button>;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold shadow-lg">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-card border-l-primary/20">
        <SheetHeader>
          <SheetTitle className="text-primary font-headline text-2xl">Oficina Zyntra 3D</SheetTitle>
          <SheetDescription>Revise seus projetos antes de iniciar a impressão.</SheetDescription>
        </SheetHeader>
        <Separator className="my-4 opacity-10" />

        {cartLoading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4">
              <div className="flex flex-col divide-y divide-white/5">
                {cartItems.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
              
              <div className="mt-6 space-y-6">
                {hasPersonalized && (
                  <div className="space-y-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <Label className="flex items-center gap-2 text-primary font-bold">
                      <LinkIcon className="h-4 w-4" /> Link do Arquivo (STL/OBJ/ZIP)
                    </Label>
                    <Input 
                      placeholder="Google Drive, Dropbox ou Mega..." 
                      value={fileLink}
                      onChange={(e) => setFileLink(e.target.value)}
                      className="bg-black/40 border-white/10"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Obrigatório para itens personalizados ou logotipos.</p>
                  </div>
                )}

                {hasPhysicalItems && (
                  <div className="space-y-4 p-4 bg-secondary/20 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="delivery-switch" className="flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-2">
                          <Truck className="h-4 w-4 text-accent" /> Logística Botucatu
                        </span>
                        <span className="font-normal text-muted-foreground text-[10px]">
                          Entregas via Zyntra Logística
                        </span>
                      </Label>
                      <Switch
                        id="delivery-switch"
                        checked={delivery}
                        onCheckedChange={setDelivery}
                      />
                    </div>

                    {delivery && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Distância (KM)</Label>
                            <Input
                              type="number"
                              value={distanceKm}
                              onChange={(e) => setDistanceKm(Number(e.target.value))}
                              className="bg-black/40 h-8"
                              placeholder="5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor do Frete</Label>
                            <div className="h-8 flex items-center px-3 bg-primary/10 border border-primary/20 rounded-md text-primary font-bold text-xs">
                              R$ {computedDeliveryFee.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Endereço de Entrega</Label>
                          <Input
                            placeholder="Ex: Bairro, Rua e Número"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-black/40 h-10 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Observações Técnicas</Label>
                  <Textarea
                    placeholder="Cor desejada, densidade de preenchimento ou urgência..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="bg-black/40 border-white/10"
                    rows={2}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t border-white/5 pt-4">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal de Projetos</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  {hasPhysicalItems && delivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logística Inteligente</span>
                      <span>R$ {computedDeliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-2xl pt-2 border-t border-white/5 mt-2">
                    <span className="gradient-text">Investimento Total</span>
                    <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/80 shadow-xl neon-border transition-all active:scale-95"
                  onClick={handleCheckout}
                  disabled={isPending || authLoading}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Finalizar Pedido</>}
                </Button>
                
                <Button variant="ghost" className="w-full text-muted-foreground text-xs" size="sm" onClick={clearCart}>
                  <Trash2 className="mr-2 h-3 w-3" /> Limpar Carrinho
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center opacity-40">
            <Box className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">Sua oficina está vazia</p>
            <p className="text-sm">Explore o catálogo e adicione itens para começar.</p>
            <SheetClose asChild>
              <Button asChild className="mt-8 bg-primary">
                <a href="/products">Ver Catálogo Zyntra</a>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
