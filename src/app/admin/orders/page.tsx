
'use client';

import { collection, orderBy, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
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
import { Clock, MapPin, Phone, MessageSquare, Truck, Package, Printer, CheckCircle2, Link as LinkIcon, Loader2, AlertCircle, Image as ImageIcon, FileCode, HardDrive } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, updates);
      toast({ title: "Pedido Atualizado", description: "As mudanças foram salvas com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao atualizar dados." });
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-headline text-primary">Gestão de Produção Zyntra</h1>
      
      <Card className="bg-secondary/10 border-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="w-[100px]">Nº</TableHead>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center w-[150px]">Status</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => {
              const StatusIcon = STATUS_CONFIG[order.status]?.icon || Clock;
              const hasDigital = order.items.some(i => i.isDigital);
              const hasPhysical = order.items.some(i => !i.isDigital);

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
                  <AccordionContent className="bg-black/40 border-t border-white/5">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Coluna 1: Status e Rastreio */}
                      <div className="space-y-6">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                          <Package className="h-4 w-4" /> Fluxo de Trabalho
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Fase de Produção</label>
                            <Select value={order.status} onValueChange={(val) => handleUpdateOrder(order.id!, { status: val as OrderStatus })}>
                              <SelectTrigger className="bg-background/50 border-white/10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {hasPhysical && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">URL de Rastreio / Envio</label>
                                <Input 
                                  placeholder="Link do frete..." 
                                  defaultValue={order.trackingLink} 
                                  onBlur={(e) => handleUpdateOrder(order.id!, { trackingLink: e.target.value })}
                                  className="bg-background/50 border-white/10"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" /> Foto da Peça Pronta (URL)
                                </label>
                                <Input 
                                  placeholder="Link da foto..." 
                                  defaultValue={order.previewImageUrl} 
                                  onBlur={(e) => handleUpdateOrder(order.id!, { previewImageUrl: e.target.value })}
                                  className="bg-background/50 border-white/10"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Coluna 2: Dados do Cliente */}
                      <div className="space-y-6">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                          <MapPin className="h-4 w-4" /> Logística e Contato
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Endereço de Entrega</p>
                            <p className="font-medium">{order.delivery ? order.location : "Retirada na Unidade Botucatu"}</p>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                            <Phone className="h-4 w-4 text-accent" />
                            <span>{order.contactPhone || "Sem tel. adicional"}</span>
                          </div>
                          {order.fileLink && (
                            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                              <p className="text-[10px] font-bold text-primary mb-2 uppercase flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" /> Arquivo do Cliente:
                              </p>
                              <a href={order.fileLink} target="_blank" className="text-accent underline break-all text-xs font-mono">{order.fileLink}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coluna 3: Itens e Obs */}
                      <div className="space-y-6">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b border-white/5 pb-2">
                          <Printer className="h-4 w-4" /> Especificações do Projeto
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex flex-col gap-1 bg-white/5 p-3 rounded-lg border border-white/5">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">{item.title} <span className="text-accent font-bold">x{item.quantity}</span></span>
                                {item.isDigital ? (
                                  <Badge variant="outline" className="text-[9px] uppercase border-accent text-accent h-4">Digital</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] uppercase border-primary text-primary h-4">Físico</Badge>
                                )}
                              </div>
                              {item.digitalLink && (
                                <div className="mt-1 text-[10px] flex items-center gap-1 text-muted-foreground">
                                  <HardDrive className="h-3 w-3" />
                                  <span className="truncate">{item.digitalLink}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {order.observation && (
                            <div className="mt-4 p-4 bg-accent/5 rounded-xl border-l-4 border-accent italic text-xs leading-relaxed">
                              "{order.observation}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
