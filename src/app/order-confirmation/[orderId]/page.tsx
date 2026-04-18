
'use client';

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, MessageCircle, Clock, MapPin, Printer, ImageIcon, Loader2, Download, Package, Truck, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams } from "next/navigation";

const STATUS_STEPS = [
  { id: 'paid', label: 'Pago', icon: Zap },
  { id: 'processing', label: 'Preparo', icon: Clock },
  { id: 'printing', label: 'Impressão', icon: Printer },
  { id: 'ready', label: 'Acabamento', icon: Package },
  { id: 'shipped', label: 'Enviado', icon: Truck },
];

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const timeZone = 'America/Sao_Paulo';

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const docRef = doc(db, "orders", orderId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrder({ 
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando seu projeto 3D...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-4xl font-headline text-primary">Projeto não localizado</h2>
        <p className="text-muted-foreground">Não encontramos o pedido #{orderId} no sistema Zyntra.</p>
        <Button asChild><Link href="/products">Voltar para a Oficina</Link></Button>
      </div>
    );
  }

  const isPaid = order.status !== 'pending' && order.status !== 'cancelled';
  const digitalItems = order.items.filter(item => item.digitalLink);

  const phoneNumber = "5514998561335";
  const message = `Olá Zyntra 3D! Gostaria de confirmar meu pedido.\n\n*Nº do Pedido:* ${order.orderNumber}\n*Status:* ${order.status}\n*Total:* R$ ${order.total.toFixed(2)}`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="container mx-auto max-w-4xl py-12 md:py-20 px-4">
      <Card className="shadow-2xl border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardHeader className="items-center text-center p-8 border-b border-white/5 bg-primary/5">
            <div className="p-4 rounded-full bg-primary/10 mb-4 animate-bounce">
              <Printer className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline text-primary">Sucesso, Maker!</CardTitle>
            <CardDescription className="text-lg">
                Seu projeto #{order.orderNumber} está no sistema Zyntra 3D.
            </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-10">
            {/* Status Visual Timeline para Itens Físicos */}
            {!digitalItems.length && (
              <div className="space-y-6">
                <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest text-center justify-center">
                  Progresso na Oficina
                </h3>
                <div className="flex justify-between items-start relative max-w-2xl mx-auto">
                   <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 -z-0" />
                   {STATUS_STEPS.map((step, idx) => {
                     const isActive = order.status === step.id || (order.status === 'delivered' && idx < STATUS_STEPS.length);
                     const isPast = ['paid', 'processing', 'printing', 'ready', 'shipped', 'delivered'].indexOf(order.status) >= ['paid', 'processing', 'printing', 'ready', 'shipped'].indexOf(step.id);
                     
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
                 <p className="text-[10px] text-muted-foreground text-center italic">Você também pode acessar esses links a qualquer momento em "Meus Projetos".</p>
              </div>
            )}

            {order.previewImageUrl && (
              <div className="space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-widest">
                  <ImageIcon className="h-4 w-4" /> Resultado da Impressão
                </h3>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/20 shadow-neon">
                  <Image src={order.previewImageUrl} alt="Preview do Pedido" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase">
                    <MapPin className="h-4 w-4" /> Logística
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                    <p className="font-medium">{order.delivery ? "Entrega programada em Botucatu" : "Retirada em Unidade"}</p>
                    {order.delivery && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{order.location}</p>}
                  </div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2 text-xs uppercase">
                    <Clock className="h-4 w-4" /> Status Financeiro
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-24 flex flex-col justify-center">
                     <Badge className={`w-fit py-1 px-4 uppercase ${isPaid ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {order.status === 'pending' ? 'Aguardando Pagamento' : order.status}
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
                      {order.delivery && (
                           <TableRow className="border-white/5">
                              <TableCell className="text-muted-foreground italic">Zyntra Logística - Taxa KM</TableCell>
                              <TableCell className="text-right">R$ {order.deliveryFee.toFixed(2)}</TableCell>
                          </TableRow>
                      )}
                      <TableRow className="bg-primary/5 hover:bg-primary/5 border-none">
                        <TableCell className="font-bold text-lg text-primary">TOTAL</TableCell>
                        <TableCell className="text-right font-bold text-lg text-primary">R$ {order.total.toFixed(2)}</TableCell>
                      </TableRow>
                  </TableBody>
                 </Table>
               </div>
            </div>

            {!isPaid && (
              <div className="text-center space-y-6 pt-4 border-t border-white/5">
                  <h4 className="font-headline text-3xl text-primary">Próximo Passo</h4>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Caso tenha pago via Pix manual ou queira agilizar a produção, envie o comprovante no nosso canal técnico.
                  </p>
                  <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full h-16 text-xl shadow-xl">
                      <Link href={whatsappUrl} target="_blank">
                          <MessageCircle className="mr-2 h-6 w-6" />
                          Confirmar Pagamento
                      </Link>
                  </Button>
              </div>
            )}
        </CardContent>
        <CardFooter className="p-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-between">
            <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/products">Continuar na Oficina</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20">
                <Link href="/my-orders">Histórico de Projetos</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
