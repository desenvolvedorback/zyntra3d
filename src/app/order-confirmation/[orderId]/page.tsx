"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Clock, MapPin, Printer, ImageIcon, Loader2, Download, Package, Truck, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STATUS_STEPS = [
  { id: 'paid', label: 'Pago', icon: Zap },
  { id: 'processing', label: 'Fatiamento', icon: Clock },
  { id: 'printing', label: 'Impressão', icon: Printer },
  { id: 'ready', label: 'Acabamento', icon: Package },
  { id: 'shipped', label: 'Enviado', icon: Truck },
];

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!orderId) return;
    
    const docRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const orderData = { 
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
        
        setOrder(orderData);

        // BUSCA INTELIGENTE DE LINKS PARA PRODUTOS DIGITAIS
        const links: Record<string, string> = {};
        for (const item of orderData.items) {
          const isDigitalSearch = item.isDigital || 
                                  item.title.toLowerCase().includes('pack') || 
                                  item.title.toLowerCase().includes('arquivo') ||
                                  !!item.digitalLink;
          
          if (isDigitalSearch) {
            if (item.digitalLink && item.digitalLink !== "") {
              links[item.id] = item.digitalLink;
            } else {
              // Fallback: Busca no catálogo original do produto
              try {
                const prodRef = doc(db, "products", item.id);
                const prodSnap = await getDoc(prodRef);
                if (prodSnap.exists()) {
                  const prodData = prodSnap.data() as Product;
                  if (prodData.digitalLink) {
                    links[item.id] = prodData.digitalLink;
                  }
                }
              } catch (e) {
                console.error("Erro no fallback do link:", e);
              }
            }
          }
        }
        setResolvedLinks(links);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!order) return <div className="container py-20 text-center"><h2 className="text-4xl font-headline text-primary">Pedido não localizado</h2><Button asChild className="mt-4"><Link href="/products">Voltar para a Loja</Link></Button></div>;

  const isPaid = order.status !== 'pending' && order.status !== 'cancelled';
  const digitalItems = order.items.filter(item => item.isDigital || !!resolvedLinks[item.id] || item.title.toLowerCase().includes('pack'));
  const hasPhysicalItems = order.items.some(item => !item.isDigital && !resolvedLinks[item.id]);

  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20 px-4">
      <Card className="shadow-2xl border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardHeader className="items-center text-center p-8 border-b border-white/5 bg-primary/5">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              {hasPhysicalItems ? <Printer className="h-12 w-12 text-primary" /> : <Zap className="h-12 w-12 text-accent" />}
            </div>
            <CardTitle className="text-4xl font-headline text-primary">Status do Pedido</CardTitle>
            <CardDescription className="text-lg">
                Pedido #{order.orderNumber} • {hasPhysicalItems ? "Acompanhe o progresso camada a camada." : "Seu acesso digital está pronto."}
            </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-10">
            {hasPhysicalItems && (
              <div className="space-y-6">
                <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest text-center justify-center">
                  Linha de Produção Física
                </h3>
                <div className="flex justify-between items-start relative max-w-2xl mx-auto">
                   <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 -z-0" />
                   {STATUS_STEPS.map((step) => {
                     const statusOrder = ['pending', 'paid', 'processing', 'printing', 'ready', 'shipped', 'delivered'];
                     const currentIdx = statusOrder.indexOf(order.status);
                     const stepIdx = statusOrder.indexOf(step.id);
                     const isPast = currentIdx >= stepIdx;
                     const StepIcon = step.icon;
                     return (
                       <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 w-1/5">
                          <div className={`p-2.5 rounded-full border-2 transition-all ${isPast ? 'bg-primary border-primary text-white' : 'bg-background border-white/10 text-muted-foreground opacity-40'}`}>
                             <StepIcon className="h-4 w-4" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase text-center ${isPast ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                       </div>
                     )
                   })}
                </div>
              </div>
            )}

            {isPaid && digitalItems.length > 0 && (
              <div className="p-6 bg-green-500/10 border-2 border-green-500/40 rounded-2xl space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-green-500 flex items-center gap-2 text-sm uppercase tracking-widest"><Download className="h-5 w-5" /> Arquivos Liberados!</h3>
                    <Badge className="bg-green-600">DOWNLOAD IMEDIATO</Badge>
                 </div>
                 <div className="grid gap-4">
                    {digitalItems.map((item, idx) => {
                      const finalLink = resolvedLinks[item.id] || item.digitalLink;
                      return (
                        <Button key={idx} asChild className="w-full bg-green-600 hover:bg-green-700 h-14 shadow-lg text-lg font-bold group">
                          <a href={finalLink || "#"} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                            Baixar: {item.title}
                          </a>
                        </Button>
                      );
                    })}
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase"><MapPin className="h-4 w-4" /> Logística de Entrega</h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                    <p className="font-medium">{order.delivery ? "Zyntra Logística - Botucatu" : "Retirada na Unidade Técnica"}</p>
                    {order.delivery && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{order.location}</p>}
                  </div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase"><Zap className="h-4 w-4" /> Status Financeiro</h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                     <Badge className={`w-fit py-1 px-4 uppercase ${isPaid ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                        {order.status === 'pending' ? 'Aguardando Pagamento' : order.status === 'cancelled' ? 'Cancelado' : "Pago com Sucesso"}
                     </Badge>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-bold text-primary text-xs uppercase tracking-widest">Resumo do Investimento</h3>
               <div className="bg-secondary/20 rounded-2xl border border-white/5 overflow-hidden">
                 <Table>
                  <TableBody>
                      {order.items.map((item, index) => (
                          <TableRow key={index} className="border-white/5">
                              <TableCell className="font-medium">{item.title} <span className="text-accent">x{item.quantity}</span></TableCell>
                              <TableCell className="text-right">R$ {(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                      ))}
                      <TableRow className="bg-primary/5 hover:bg-primary/5 border-none">
                        <TableCell className="font-bold text-lg text-primary">TOTAL</TableCell>
                        <TableCell className="text-right font-bold text-lg text-primary">R$ {order.total.toFixed(2)}</TableCell>
                      </TableRow>
                  </TableBody>
                 </Table>
               </div>
            </div>

            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full h-16 text-xl">
                <Link href={`https://wa.me/5514991023986?text=Oi! Quero falar sobre meu pedido %23${order.orderNumber}`} target="_blank">
                    <MessageCircle className="mr-2 h-6 w-6" /> Suporte Técnico WhatsApp
                </Link>
            </Button>
        </CardContent>
        <CardFooter className="p-8 border-t border-white/5 flex gap-4 justify-between">
            <Button asChild variant="ghost"><Link href="/products">Continuar na Oficina</Link></Button>
            <Button asChild variant="outline" className="border-primary/20"><Link href="/my-orders">Ir para Meus Pedidos</Link></Button>
        </CardFooter>
      </Card>
    </div>
  );
}
