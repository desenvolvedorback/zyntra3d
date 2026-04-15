
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, MessageCircle, Clock, MapPin, Phone, MessageSquare, Printer, ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

async function getOrder(id: string): Promise<Order | null> {
  try {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export default async function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const order = await getOrder(params.orderId);
  const timeZone = 'America/Sao_Paulo';

  if (!order) {
    return <div className="container py-20 text-center font-headline text-primary">Pedido não localizado no sistema Zyntra.</div>;
  }

  const slotText = order.deliverySlot === 'morning' ? 'Manhã (11:00)' : 'Tarde (17:00)';
  const isSundayOrder = order.createdAt.getDay() === 0;

  const phoneNumber = "5514998561335";
  const message = `Olá Zyntra 3D! Gostaria de confirmar meu pedido.\n\n*Nº do Pedido:* ${order.orderNumber}\n*Status:* ${order.status}\n*Total:* R$ ${order.total.toFixed(2)}`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="container mx-auto max-w-3xl py-12 md:py-20 px-4">
      <Card className="shadow-2xl border border-white/5 bg-card/50 backdrop-blur-xl">
        <CardHeader className="items-center text-center p-8 border-b border-white/5">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Printer className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline text-primary">Sucesso, Maker!</CardTitle>
            <CardDescription className="text-lg">
                Seu projeto #{order.orderNumber} entrou na fila de produção.
            </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
            {/* Visualização da Peça Pronta (Se houver) */}
            {order.previewImageUrl && (
              <div className="space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-widest">
                  <ImageIcon className="h-4 w-4" /> Resultado da Impressão
                </h3>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/20 shadow-neon">
                  <Image src={order.previewImageUrl} alt="Preview do Pedido" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase">
                  <Clock className="h-4 w-4" /> Agendamento
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <p className="font-medium text-lg">{order.delivery ? slotText : "Retirada em Unidade"}</p>
                  {isSundayOrder && <p className="text-xs text-accent font-bold">⚠️ Entrega programada para Segunda-feira.</p>}
                  {order.delivery && <p className="text-xs text-muted-foreground">{order.location}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase">
                  <CheckCircle2 className="h-4 w-4" /> Status Atual
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-center h-[92px]">
                   <Badge className="w-fit text-lg py-1 px-4 bg-primary/20 text-primary border-primary/20 uppercase">
                     {order.status}
                   </Badge>
                </div>
              </div>
            </div>

            <Separator className="opacity-5" />

            <div className="space-y-4">
               <h3 className="font-bold text-primary text-xs uppercase tracking-widest">Resumo do Projeto</h3>
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
                            <TableCell className="text-muted-foreground italic">Taxa de Logística Botucatu</TableCell>
                            <TableCell className="text-right">R$ {order.deliveryFee.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
               </Table>
            </div>

            <div className="flex justify-between items-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-muted-foreground font-bold uppercase text-xs">Investimento Total</span>
                <span className="text-3xl font-headline text-primary">R$ {order.total.toFixed(2)}</span>
            </div>

            <div className="text-center space-y-6 pt-4">
                <h4 className="font-headline text-3xl text-primary">Próximo Passo</h4>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Para agilizar o início da sua impressão, envie o comprovante via WhatsApp. Nossa equipe técnica confirmará as especificações com você.
                </p>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full h-16 text-xl shadow-xl hover:scale-105 transition-all">
                    <Link href={whatsappUrl} target="_blank">
                        <MessageCircle className="mr-2 h-6 w-6" />
                        Confirmar com Técnico
                    </Link>
                </Button>
            </div>
        </CardContent>
        <CardFooter className="p-8 border-t border-white/5">
            <Button asChild className="w-full" variant="ghost">
                <Link href="/products">Explorar mais Projetos</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
