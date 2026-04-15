
'use client';

import { collection, getDocs, orderBy, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { Clock, MapPin, Phone, MessageSquare, Truck, Package, Printer, CheckCircle2, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatus } from "@/lib/actions/orderActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-amber-500' },
  paid: { label: 'Pago', icon: Package, color: 'text-green-500' },
  processing: { label: 'Em Análise', icon: Loader2, color: 'text-blue-500' },
  printing: { label: 'Imprimindo', icon: Printer, color: 'text-purple-500' },
  ready: { label: 'Pronto', icon: CheckCircle2, color: 'text-cyan-500' },
  shipped: { label: 'Enviado', icon: Truck, color: 'text-indigo-500' },
  delivered: { label: 'Entregue', icon: CheckCircle2, color: 'text-emerald-500' },
  cancelled: { label: 'Cancelado', icon: MessageSquare, color: 'text-destructive' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const timeZone = 'America/Sao_Paulo';

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("orderNumber", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Order));
      setOrders(orderList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, currentTracking?: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, currentTracking);
      toast({ title: "Status Atualizado", description: `Pedido movido para ${STATUS_CONFIG[newStatus].label}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao atualizar status." });
    }
  };

  const handleTrackingUpdate = async (orderId: string, currentStatus: OrderStatus, tracking: string) => {
    try {
      await updateOrderStatus(orderId, currentStatus, tracking);
      toast({ title: "Link de Envio Salvo", description: "O cliente agora pode ver o rastreio." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar link." });
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline text-primary">Gestão de Produção</h1>
       <Card className="bg-secondary/10 border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Produção</TableHead>
                <TableHead className="w-[180px]">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center w-[150px]">Fase Atual</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          {orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {orders.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status]?.icon || Clock;
                return (
                  <AccordionItem value={order.id!} key={order.id} className="border-white/5">
                    <AccordionTrigger className="px-4 text-sm hover:no-underline hover:bg-white/5">
                      <div className="flex w-full items-center">
                          <div className="w-[100px] text-left font-bold text-accent">#{order.orderNumber}</div>
                          <div className="w-[180px] text-left text-muted-foreground">{formatInTimeZone(order.createdAt, timeZone, "d/MM HH:mm", { locale: ptBR })}</div>
                          <div className="flex-1 text-left font-medium">{order.customer?.name}</div>
                          <div className="w-[150px] flex justify-center">
                              <Badge className={`${STATUS_CONFIG[order.status].color} bg-background/50 border-white/10 gap-1.5`}>
                                <StatusIcon className="h-3 w-3" />
                                {STATUS_CONFIG[order.status].label}
                              </Badge>
                          </div>
                          <div className="w-[120px] text-right font-bold text-primary">R$ {order.total.toFixed(2)}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-black/40">
                      <div className="p-6 space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Gestão de Status */}
                              <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                                  <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                    <Package className="h-4 w-4" /> Fluxo de Produção
                                  </h4>
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground uppercase">Alterar Status</p>
                                      <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id!, val as OrderStatus, order.trackingLink)}>
                                        <SelectTrigger className="bg-background">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground uppercase">Link de Rastreio / Arquivo</p>
                                      <div className="flex gap-2">
                                        <Input 
                                          placeholder="https://..." 
                                          defaultValue={order.trackingLink} 
                                          onBlur={(e) => handleTrackingUpdate(order.id!, order.status, e.target.value)}
                                          className="bg-background"
                                        />
                                      </div>
                                    </div>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="font-bold text-primary border-b border-white/10 pb-2">Logística</h4>
                                  <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> {order.contactPhone || 'Sem telefone adicional'}</p>
                                    <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-accent mt-0.5" /> {order.location || 'Retirada na Loja'}</p>
                                    {order.fileLink && (
                                      <div className="p-3 rounded bg-primary/10 border border-primary/20 mt-4">
                                        <p className="text-xs font-bold text-primary flex items-center gap-1 mb-1"><LinkIcon className="h-3 w-3" /> ARQUIVO DO CLIENTE:</p>
                                        <a href={order.fileLink} target="_blank" className="text-accent underline break-all text-xs">{order.fileLink}</a>
                                      </div>
                                    )}
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="font-bold text-primary border-b border-white/10 pb-2">Projeto</h4>
                                  <div className="space-y-2">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="flex justify-between text-sm bg-white/5 p-2 rounded">
                                        <span>{item.title} <span className="text-muted-foreground">x{item.quantity}</span></span>
                                        <span className="font-bold text-accent">R$ {item.unit_price.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    {order.observation && (
                                      <div className="mt-4 p-3 bg-white/5 rounded italic text-xs border-l-2 border-accent">
                                        "{order.observation}"
                                      </div>
                                    )}
                                  </div>
                              </div>
                          </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center p-12 text-muted-foreground">Nenhum projeto em produção.</div>
          )}
        </CardContent>
       </Card>
    </div>
  );
}
