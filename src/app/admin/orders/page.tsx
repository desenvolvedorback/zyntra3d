import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


async function getOrders(): Promise<Order[]> {
  const ordersCollection = collection(db, "orders");
  const q = query(ordersCollection, orderBy("createdAt", "desc"));
  const orderSnapshot = await getDocs(q);
  const orderList = orderSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Order;
  });
  return orderList;
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline text-primary">Pedidos Recebidos</h1>
      </div>
       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Pedido</TableHead>
                <TableHead className="w-[180px]">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center w-[120px]">Status</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          {orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {orders.map((order) => (
                <AccordionItem value={order.id!} key={order.id}>
                   <AccordionTrigger className="px-4 text-sm hover:no-underline">
                     <div className="flex w-full items-center">
                        <div className="w-[100px] text-left font-semibold text-primary">#{order.orderNumber}</div>
                        <div className="w-[180px] text-left">{format(order.createdAt, "d MMM, yyyy 'às' HH:mm", { locale: ptBR })}</div>
                        <div className="flex-1 text-left font-medium">{order.customer?.name || 'N/A'}</div>
                        <div className="w-[120px] flex justify-center">
                            <Badge variant={order.status === 'paid' ? 'secondary' : 'outline'}>
                                {order.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                        </div>
                        <div className="w-[120px] text-right font-medium">R$ {(order.total || 0).toFixed(2)}</div>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent>
                    <div className="bg-muted/50 p-4 space-y-4">
                        <h4 className="font-semibold">Detalhes do Pedido</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Cliente</p>
                                <p>{order.customer?.name} ({order.customer?.email})</p>
                            </div>
                            {order.delivery && (
                                <div>
                                    <p className="text-muted-foreground">Endereço de Entrega</p>
                                    <p>{order.location}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-muted-foreground">ID do Pagamento (MP)</p>
                                <p>{order.paymentId || 'N/A'}</p>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="w-24">Qtd.</TableHead>
                                <TableHead className="text-right w-32">Preço Unit.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">R$ {(item.unit_price || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
                Nenhum pedido encontrado.
            </div>
          )}
        </CardContent>
       </Card>
    </div>
  );
}
```