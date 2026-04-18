
'use client';

import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, Clock, MapPin, Printer, ImageIcon, Loader2, Download, Package, Truck, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    
    const docRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({ 
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to order:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando status na oficina...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-4xl font-headline text-primary">Pedido não localizado</h2>
        <p className="text-muted-foreground">Não encontramos o pedido informado no sistema Zyntra.</p>
        <Button asChild><Link href="/products">Voltar para a Loja</Link></Button>
      </div>
    );
  }

  const isPaid = order.status !== 'pending' && order.status !== 'cancelled';
  const digitalItems = order.items.filter(item => item.isDigital);
  const hasPhysicalItems = order.items.some(item => !item.isDigital);

  const adminPhone = "5514991023986";
  const message = `Olá Zyntra 3D! Gostaria de falar sobre o meu pedido.\n\n*Nº do Pedido:* ${order.orderNumber}\n*Status:* ${order.status}`;
  const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20 px-4">
      <Card className="shadow-2xl border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardHeader className="items-center text-center p-8 border-b border-white/5 bg-primary/5">
            <div className="p-4 rounded-full bg-primary/10 mb-4 animate-bounce">
              <Printer className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline text-primary">Status da Sua Ideia</CardTitle>
            <CardDescription className="text-lg">
                Pedido #{order.orderNumber} • Acompanhe o progresso camada a camada.
            </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-10">
            {/* Status Visual Timeline para Itens Físicos */}
            {hasPhysicalItems && (
              <div className="space-y-6">
                <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest text-center justify-center">
                  Linha de Produção
                </h3>
                <div className="flex justify-between items-start relative max-w-2xl mx-auto">
                   <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 -z-0" />
                   {STATUS_STEPS.map((step, idx) => {
                     const statusIndex = ['paid', 'processing', 'printing', 'ready', 'shipped', 'delivered'].indexOf(order.status);
                     const stepIndex = ['paid', 'processing', 'printing', 'ready', 'shipped'].indexOf(step.id);
                     const isPast = statusIndex >= stepIndex;
                     
                     return (
                       <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 w-1/5">
                          <div className={`p-2.5 rounded-full border-2 transition-all ${isPast ? 'bg-primary border-primary text-white' : 'bg-background border-white/10 text-muted-foreground opacity-40'}`}>
                             <step.icon className="h-4 w-4" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase text-center ${isPast ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                       </div>
                     )
                   })}
                </div>
              </div>
            )}

            {/* Downloads para Itens Digitais */}
            {isPaid && digitalItems.length > 0 && (
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl space-y-4">
                 <h3 className="font-bold text-green-500 flex items-center gap-2 text-sm uppercase tracking-widest">
                   <Download className="h-4 w-4" /> Arquivos Liberados!
                 </h3>
                 <div className="grid gap-3">
                    {digitalItems.map((item, idx) => (
                      <Button key={idx} asChild className="w-full bg-green-600 hover:bg-green-700 h-12">
                        <a href={item.digitalLink} target="_blank">Baixar: {item.title}</a>
                      </Button>
                    ))}
                 </div>
                 <p className="text-[10px] text-muted-foreground text-center italic">Acesse seus arquivos sempre que quiser na seção "Meus Pedidos".</p>
              </div>
            )}

            {/* Alertas de Logística */}
            {order.status === 'shipped' && order.trackingLink ? (
              <Alert className="bg-indigo-500/10 border-indigo-500/30">
                <Truck className="h-4 w-4 text-indigo-500" />
                <AlertTitle className="text-indigo-500 font-bold">Pedido Enviado!</AlertTitle>
                <AlertDescription>
                  Seu projeto já saiu da oficina. <a href={order.trackingLink} target="_blank" className="underline font-bold">Acompanhe a rota de entrega clicando aqui.</a>
                </AlertDescription>
              </Alert>
            ) : hasPhysicalItems && (
              <Alert className="bg-primary/10 border-primary/20">
                <Clock className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Aguardando Envio</AlertTitle>
                <AlertDescription>
                  Sua peça está na fase de {order.status === 'ready' ? 'embalagem final' : 'produção técnica'}. Você receberá o link da rota assim que o entregador sair.
                </AlertDescription>
              </Alert>
            )}

            {order.previewImageUrl && (
              <div className="space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest">
                  <ImageIcon className="h-4 w-4" /> Resultado da Impressão
                </h3>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/20">
                  <Image src={order.previewImageUrl} alt="Preview do Pedido" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase">
                    <MapPin className="h-4 w-4" /> Endereço de Entrega
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                    <p className="font-medium">{order.delivery ? "Zyntra Logística - Botucatu" : "Retirada na Unidade Técnica"}</p>
                    {order.delivery && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{order.location}</p>}
                  </div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase">
                    <Clock className="h-4 w-4" /> Status Financeiro
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                     <Badge className={`w-fit py-1 px-4 uppercase ${isPaid ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {order.status === 'pending' ? 'Aguardando Pagamento' : "Pago com Sucesso"}
                     </Badge>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-bold text-primary text-xs uppercase tracking-widest">Resumo do Pedido</h3>
               <div className="bg-secondary/20 rounded-2xl border border-white/5 overflow-hidden">
                 <Table>
                  <TableBody>
                      {order.items.map((item, index) => (
                          <TableRow key={index} className="border-white/5">
                              <TableCell className="font-medium">
                                {item.title} <span className="text-accent">x{item.quantity}</span>
                                {item.isDigital && <Badge variant="outline" className="ml-2 text-[8px] h-3 uppercase border-accent text-accent">Digital</Badge>}
                              </TableCell>
                              <TableCell className="text-right">R$ {(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                      ))}
                      {order.delivery && (
                           <TableRow className="border-white/5">
                              <TableCell className="text-muted-foreground italic">Taxa de Logística Inteligente</TableCell>
                              <TableCell className="text-right">R$ {order.deliveryFee.toFixed(2)}</TableCell>
                          </TableRow>
                      )}
                      <TableRow className="bg-primary/5 hover:bg-primary/5 border-none">
                        <TableCell className="font-bold text-lg text-primary">TOTAL DO INVESTIMENTO</TableCell>
                        <TableCell className="text-right font-bold text-lg text-primary">R$ {order.total.toFixed(2)}</TableCell>
                      </TableRow>
                  </TableBody>
                 </Table>
               </div>
            </div>

            <div className="text-center space-y-6 pt-4 border-t border-white/5">
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Alguma dúvida técnica sobre o fatiamento ou material? Fale direto com nossos makers.
                </p>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full h-16 text-xl shadow-xl">
                    <Link href={whatsappUrl} target="_blank">
                        <MessageCircle className="mr-2 h-6 w-6" />
                        Suporte Técnico WhatsApp
                    </Link>
                </Button>
            </div>
        </CardContent>
        <CardFooter className="p-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-between">
            <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/products">Continuar na Oficina</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20">
                <Link href="/my-orders">Ver Meus Pedidos</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
