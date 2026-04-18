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
  const cartContext = useCart();
  if (!cartContext) return null;

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
  } = cartContext;

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
    return distanceKm <= 5 ? 0 : distanceKm * 1.5;
  }, [delivery, distanceKm]);

  const finalPrice = totalPrice + computedDeliveryFee;

  const hasPersonalized = cartItems.some(item => 
    item.category === 'Personalizados' || item.category === 'Logotipos'
  );

  const hasPhysicalItems = cartItems.some(item => !item.isDigital);

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
    
    startTransition(async () => {
      try {
        const orderRef = doc(collection(db, "orders"));
        const orderNumber = Math.floor(Math.random() * 9000) + 1000;

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
            name: userProfile.displayName || "Maker",
            email: userProfile.email || "",
          },
          delivery: hasPhysicalItems && delivery,
          deliveryFee: hasPhysicalItems && delivery ? computedDeliveryFee : 0,
          location: hasPhysicalItems && delivery ? location : (hasPhysicalItems ? 'Retirada' : 'Digital'),
          observation,
          fileLink,
          contactPhone: contactPhone || userProfile.phone || '',
          createdAt: serverTimestamp(),
        };

        await setDoc(orderRef, orderPayload);

        // ENVIAR APENAS DADOS PRIMITIVOS PARA A SERVER ACTION
        const checkoutUrl = await mercadoPagoCheckout({
          items: orderPayload.items.map(i => ({
            id: String(i.id),
            title: String(i.title),
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price)
          })),
          user: {
            uid: String(userProfile.uid),
            email: String(userProfile.email || ""),
            displayName: String(userProfile.displayName || "Maker"),
            cpf: String(userProfile.cpf || ""),
            phone: String(userProfile.phone || contactPhone || "")
          },
          deliveryFee: Number(orderPayload.deliveryFee),
          location: String(orderPayload.location),
          orderId: String(orderRef.id),
          orderNumber: Number(orderNumber),
        });

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error("Erro ao conectar com o Mercado Pago.");
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro no Checkout", description: error.message || "Tente novamente." });
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
          <SheetTitle className="text-primary font-headline text-2xl">Carrinho Zyntra 3D</SheetTitle>
          <SheetDescription>Revise seus pedidos antes de iniciar a impressão.</SheetDescription>
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
                  </div>
                )}

                {hasPhysicalItems && (
                  <div className="space-y-4 p-4 bg-secondary/20 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="delivery-switch" className="flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Logística Botucatu</span>
                      </Label>
                      <Switch id="delivery-switch" checked={delivery} onCheckedChange={setDelivery} />
                    </div>

                    {delivery && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Distância (KM)</Label>
                            <Input type="number" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="bg-black/40 h-8" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Frete</Label>
                            <div className="h-8 flex items-center px-3 bg-primary/10 border border-primary/20 rounded-md text-primary font-bold text-xs">
                              R$ {computedDeliveryFee.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <Input placeholder="Endereço Completo" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-black/40 h-10 text-sm" />
                      </div>
                    )}
                  </div>
                )}

                <Textarea placeholder="Observações Técnicas..." value={observation} onChange={(e) => setObservation(e.target.value)} className="bg-black/40 border-white/10" rows={2} />
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto border-t border-white/5 pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center font-bold text-2xl">
                  <span className="gradient-text">Total</span>
                  <span className="text-primary">R$ {finalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/80" onClick={handleCheckout} disabled={isPending || authLoading}>
                  {isPending ? <Loader2 className="animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Pagar com Mercado Pago</>}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground text-xs" size="sm" onClick={clearCart}>Limpar Carrinho</Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center opacity-40">
            <Box className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">Seu carrinho está vazio</p>
            <SheetClose asChild><Button asChild className="mt-8 bg-primary"><a href="/products">Ver Catálogo</a></Button></SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
