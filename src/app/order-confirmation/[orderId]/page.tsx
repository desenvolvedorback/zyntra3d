import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
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

  if (!order) {
    return <div className="container py-12 text-center">Pedido não encontrado.</div>;
  }

  const statusText = order.status === 'paid' ? 'Pagamento Aprovado' : 'Pagamento Pendente';
  const statusVariant = order.status === 'paid' ? 'secondary' : 'outline';

  return (
    <div className="container mx-auto max-w-2xl py-12 md:py-20">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline text-primary">Obrigado pelo seu pedido!</CardTitle>
            <CardDescription className="text-lg">
                Seu pedido #{order.orderNumber} foi recebido.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Data do Pedido</span>
                <span>{format(order.createdAt, "d MMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
                <span className="text-muted-foreground">Status do Pagamento</span>
                <Badge variant={statusVariant} className="capitalize">{statusText}</Badge>
            </div>
            
            <Separator className="my-6" />

            <h3 className="font-semibold mb-4 text-base">Resumo do Pedido</h3>

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

            <div className="flex justify-end items-center font-bold text-lg">
                <span className="mr-4">Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
            </div>

            {order.delivery && (
                <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                    <p className="font-semibold">Endereço de Entrega:</p>
                    <p className="text-muted-foreground">{order.location}</p>
                </div>
            )}
             {order.status === 'pending' && (
                <div className="mt-6 text-center text-muted-foreground bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg">
                   <p className="font-semibold">Aguardando Pagamento</p>
                   <p>Atualizaremos o status assim que o pagamento for confirmado. Você pode fechar esta página.</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="p-6">
            <Button asChild className="w-full">
                <Link href="/products">Continuar Comprando</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
