
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
    deliveryPromotion,
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

  const dynamicDeliveryFee = useMemo(() => {
    if (distanceKm <= 5) return 0;
    return distanceKm * 1.5;
  }, [distanceKm]);

  const finalDeliveryFee = useMemo(() => {
    if (!deliveryPromotion) return dynamicDeliveryFee;
    if (deliveryPromotion.discountType === 'fixed') {
      return Math.max(0, dynamicDeliveryFee - deliveryPromotion.discountValue);
    }
    return dynamicDeliveryFee * (1 - deliveryPromotion.discountValue / 100);
  }, [dynamicDeliveryFee, deliveryPromotion]);

  const finalPrice = delivery ? totalPrice + finalDeliveryFee : totalPrice;

  const needsFileLink = cartItems.some(item => 
    item.category === 'Arquivos 3D' || item.category === 'Personalizados'
  );

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
      toast({ variant: "destructive", title: "Login Necessário", description: "Faça login para finalizar a compra." });
      router.push('/login');
      return;
    }

    if (delivery && !location.trim()) {
      toast({ variant: "destructive", title: "Endereço Necessário", description: "Insira o endereço para entrega." });
      return;
    }

    if (needsFileLink && !fileLink.trim()) {
      toast({ variant: "destructive", title: "Link do Arquivo", description: "Por favor, insira o link do seu modelo 3D (Drive/ZIP)." });
      return;
    }
    
    startTransition(async () => {
      try {
        const orderNumber = await getNextOrderNumber();
        const orderRef = doc(collection(db, "orders"));
        const isDelivery = (finalDeliveryFee || 0) > 0 && !!location;

        const orderPayload = {
          orderNumber,
          status: 'pending',
          total: finalPrice,
          items: cartItems.map(item => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            digitalLink: item.digitalLink || "",
          })),
          customer: {
            id: userProfile.uid,
            name: userProfile.displayName || "Usuário Zyntra",
            email: userProfile.email || "cliente@zyntra.com",
          },
          delivery: isDelivery,
          deliveryFee: isDelivery ? (finalDeliveryFee || 0) : 0,
          location: isDelivery ? (location || '') : '',
          observation: observation,
          fileLink: fileLink,
          contactPhone: contactPhone || userProfile.phone || '',
          createdAt: serverTimestamp(),
          paymentId: null,
        };

        await setDoc(orderRef, orderPayload);

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
          orderId: orderRef.id,
          orderNumber: orderNumber,
          observation: observation,
          contactPhone,
        });

        if (checkoutUrl) window.location.href = checkoutUrl;
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro no Checkout", description: error.message || "Falha ao processar pedido." });
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
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-card border-l-primary/20">
        <SheetHeader>
          <SheetTitle className="text-primary font-headline text-2xl">Oficina Zyntra 3D</SheetTitle>
          <SheetDescription>Revise seus projetos e finalize a produção.</SheetDescription>
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
                {needsFileLink && (
                  <div className="space-y-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <Label className="flex items-center gap-2 text-primary">
                      <LinkIcon className="h-4 w-4" /> Link do Arquivo 3D (Drive/Mega/ZIP)
                    </Label>
                    <Input 
                      placeholder="https://drive.google.com/..." 
                      value={fileLink}
                      onChange={(e) => setFileLink(e.target.value)}
                      className="bg-black/40"
                    />
                    <p className="text-[10px] text-muted-foreground">Necessário para projetos personalizados ou impressões diretas.</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delivery-switch" className="flex flex-col gap-1">
                      <span className="font-bold flex items-center gap-2">
                        <Truck className="h-4 w-4 text-accent" /> Calcular Frete (KM)
                      </span>
                      <span className="font-normal text-muted-foreground text-xs">
                        Baseado na distância de Botucatu-SP
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
                          <Label>Distância Aproximada (KM)</Label>
                          <Input
                            type="number"
                            value={distanceKm}
                            onChange={(e) => setDistanceKm(Number(e.target.value))}
                            className="bg-black/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor do Frete</Label>
                          <div className="h-10 flex items-center px-3 bg-muted rounded-md text-primary font-bold">
                            R$ {finalDeliveryFee.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Endereço Completo</Label>
                        <Input
                          placeholder="Cidade, Bairro, Rua e Número"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-black/40"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Observações do Projeto</Label>
                  <Textarea
                    placeholder="Cor, preenchimento, acabamento ou detalhes técnicos..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="bg-black/40"
                    rows={2}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t border-white/5 pt-4">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  {delivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logística (KM)</span>
                      <span>R$ {finalDeliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-2xl pt-2">
                    <span className="gradient-text">Total</span>
                    <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/80 neon-border"
                  onClick={handleCheckout}
                  disabled={isPending || authLoading}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Iniciar Produção</>}
                </Button>
                
                <Button variant="ghost" className="w-full text-muted-foreground" size="sm" onClick={clearCart}>
                  <Trash2 className="mr-2 h-4 w-4" /> Cancelar Orçamento
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center opacity-40">
            <Box className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">Sua oficina está vazia</p>
            <p className="text-sm">Selecione um modelo ou envie seu projeto para começar na Zyntra 3D.</p>
            <SheetClose asChild>
              <Button asChild className="mt-8 bg-primary">
                <a href="/products">Ver Catálogo</a>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
