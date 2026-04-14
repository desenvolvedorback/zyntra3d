import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, MessageCircle, Clock, MapPin, Phone, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";


async function getOrder(id: string): Promise<Order | null> {
  try {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
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
    return <div className="container py-12 text-center">Pedido não encontrado.</div>;
  }

  const statusText = order.status === 'paid' ? 'Pagamento Aprovado' : 'Pagamento Pendente';
  const statusVariant = order.status === 'paid' ? 'secondary' : 'outline';

  const slotText = order.deliverySlot === 'morning' ? 'Manhã (11:00)' : 'Tarde (17:00)';
  
  // Se foi feito no domingo, avisar que a entrega é segunda
  const isSundayOrder = order.createdAt.getDay() === 0;

  const phoneNumber = "5514998561335";
  const message = `Olá! Gostaria de confirmar meu pedido.\n\n*Nº do Pedido:* ${order.orderNumber}\n*Cliente:* ${order.customer?.name}\n*E-mail:* ${order.customer?.email}\n*Valor Total:* R$ ${order.total.toFixed(2)}\n*Entrega:* ${order.delivery ? 'Sim' : 'Retirada'}\n${order.delivery ? `*Horário:* ${slotText}${isSundayOrder ? ' (Entrega na Segunda)' : ''}\n` : ''}\nObrigado(a)!`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;


  return (
    <div className="container mx-auto max-w-2xl py-12 md:py-20">
      <Card className="shadow-lg border-t-8 border-primary">
        <CardHeader className="items-center text-center p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline text-primary">Obrigado pelo seu pedido!</CardTitle>
            <CardDescription className="text-lg">
                Seu pedido #{order.orderNumber} foi recebido com sucesso.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-sm">
            <div className="grid grid-cols-2 gap-4 mb-6 bg-muted/30 p-4 rounded-lg">
              <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-bold">Data</span>
                  <span className="font-medium">{formatInTimeZone(order.createdAt, timeZone, "d MMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-muted-foreground text-xs uppercase font-bold">Pagamento</span>
                  <Badge variant={statusVariant} className="mt-1">{statusText}</Badge>
              </div>
            </div>

            {order.delivery && (
              <div className="mb-6 space-y-4">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Logística de Entrega
                </h3>
                <div className="grid gap-3 bg-muted/50 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Horário Agendado: {slotText}</p>
                      {isSundayOrder && (
                        <p className="text-xs text-amber-700 font-bold">⚠️ Entrega programada para Segunda-feira.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Local de Entrega:</p>
                      <p className="text-muted-foreground">{order.location}</p>
                    </div>
                  </div>
                  {order.contactPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary" />
                      <p><span className="font-semibold">Telefone Adicional:</span> {order.contactPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.observation && (
              <div className="mb-6">
                <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" /> Observações
                </h3>
                <div className="bg-muted/50 p-3 rounded-lg text-muted-foreground italic">
                  "{order.observation}"
                </div>
              </div>
            )}
            
            <Separator className="my-6" />

            <h3 className="font-bold mb-4 text-primary uppercase tracking-wider text-xs">Resumo do Pedido</h3>

            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-24 text-center">Qtd.</TableHead>
                    <TableHead className="text-right w-32">Subtotal</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">R$ {(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                    {order.delivery && (
                         <TableRow>
                            <TableCell>Taxa de Entrega</TableCell>
                            <TableCell className="text-center">1</TableCell>
                            <TableCell className="text-right">R$ {order.deliveryFee.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            <Separator className="my-4" />

            <div className="flex justify-end items-center font-bold text-xl">
                <span className="mr-4 text-muted-foreground font-normal text-sm">TOTAL DO PEDIDO</span>
                <span className="text-primary font-headline text-2xl">R$ {order.total.toFixed(2)}</span>
            </div>

             {order.status === 'pending' && (
                <div className="mt-8 text-center text-muted-foreground bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
                   <p className="font-bold">Aguardando Pagamento</p>
                   <p className="text-sm">O status será atualizado automaticamente após a confirmação do Mercado Pago.</p>
                </div>
            )}

            <Separator className="my-8" />

            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest mb-2">
                  <CheckCircle2 className="h-3 w-3" /> Etapa Final
                </div>
                <h4 className="font-headline text-2xl text-primary">Confirme seu pedido agora!</h4>
                <p className="text-muted-foreground text-sm px-4">
                  Envie o comprovante para a loja pelo WhatsApp. Isso agiliza a preparação e garante sua entrega no horário agendado!
                </p>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full max-w-sm mx-auto shadow-lg h-14 text-lg">
                    <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-6 w-6" />
                        Enviar Comprovante
                    </Link>
                </Button>
            </div>
        </CardContent>
        <CardFooter className="p-6">
            <Button asChild className="w-full" variant="outline">
                <Link href="/products">Voltar para a Loja</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
