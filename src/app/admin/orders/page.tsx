import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, MapPin, Phone, MessageSquare, Calendar } from "lucide-react";


async function getOrders(): Promise<Order[]> {
  const ordersCollection = collection(db, "orders");
  const q = query(ordersCollection, orderBy("orderNumber", "desc"));
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
  const timeZone = 'America/Sao_Paulo';

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
              {orders.map((order) => {
                const isSundayOrder = order.createdAt.getDay() === 0;
                const slotText = order.deliverySlot === 'morning' ? 'Manhã (11:00)' : 'Tarde (17:00)';
                
                return (
                  <AccordionItem value={order.id!} key={order.id}>
                    <AccordionTrigger className="px-4 text-sm hover:no-underline">
                      <div className="flex w-full items-center">
                          <div className="w-[100px] text-left font-semibold text-primary">#{order.orderNumber}</div>
                          <div className="w-[180px] text-left">{formatInTimeZone(order.createdAt, timeZone, "d MMM, yyyy 'às' HH:mm", { locale: ptBR })}</div>
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
                      <div className="bg-muted/50 p-4 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                              <div className="space-y-4">
                                  <h4 className="font-bold flex items-center gap-2 text-primary border-b pb-1">
                                    Informações do Cliente
                                  </h4>
                                  <p><span className="text-muted-foreground">Nome:</span> {order.customer?.name}</p>
                                  <p><span className="text-muted-foreground">E-mail:</span> {order.customer?.email}</p>
                                  {order.contactPhone && (
                                    <p className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-primary" />
                                      <span className="font-semibold text-green-700">{order.contactPhone}</span>
                                    </p>
                                  )}
                                  <p><span className="text-muted-foreground">ID do Pagamento (MP):</span> {order.paymentId || 'Pendente'}</p>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="font-bold flex items-center gap-2 text-primary border-b pb-1">
                                    Logística e Entrega
                                  </h4>
                                  {order.delivery ? (
                                    <>
                                      <div className="flex items-start gap-2">
                                        <Clock className="h-4 w-4 text-primary mt-0.5" />
                                        <div>
                                          <p className="font-bold text-base">{slotText}</p>
                                          {isSundayOrder && (
                                            <Badge variant="destructive" className="mt-1 animate-pulse">
                                              ENTREGAR NA SEGUNDA
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-primary mt-0.5" />
                                        <p>{order.location}</p>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="font-bold text-amber-600 uppercase">Retirada na Loja</p>
                                  )}
                                  
                                  {order.observation && (
                                    <div className="mt-4 p-3 bg-white rounded border border-primary/20">
                                      <h5 className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                                        <MessageSquare className="h-3 w-3" /> OBSERVAÇÕES:
                                      </h5>
                                      <p className="italic">"{order.observation}"</p>
                                    </div>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-bold text-primary border-b pb-1">Itens do Pedido</h4>
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
                                    {order.delivery && (
                                      <TableRow className="bg-muted">
                                        <TableCell className="font-bold">Taxa de Entrega</TableCell>
                                        <TableCell>1</TableCell>
                                        <TableCell className="text-right">R$ {order.deliveryFee.toFixed(2)}</TableCell>
                                      </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                          </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
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
