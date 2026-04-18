
'use client';

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Truck, Printer, CheckCircle2, Clock, AlertCircle, Download, FileCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Aguardando Pagamento', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  paid: { label: 'Pago - Fila de Impressão', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  processing: { label: 'Processando Arquivos', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Printer },
  printing: { label: 'Na Impressora 3D', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Printer },
  ready: { label: 'Pronto para Envio', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', icon: Package },
  shipped: { label: 'Despachado', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("customer.id", "==", user.uid),
      orderBy("orderNumber", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Order));
      setOrders(orderList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-2xl font-headline text-primary">Acesso Restrito</h2>
        <p>Faça login para ver seu histórico de pedidos na Zyntra 3D.</p>
        <Button asChild><Link href="/login">Ir para Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-headline text-primary mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe a materialização das suas ideias na Zyntra 3D.</p>
        </div>
        <Button asChild variant="outline" className="border-primary/20">
          <Link href="/products">Novo Pedido</Link>
        </Button>
      </div>

      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const isPaid = order.status !== 'pending' && order.status !== 'cancelled';
            
            return (
              <Card key={order.id} className="bg-secondary/20 border-white/5 overflow-hidden transition-all hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between bg-black/40 border-b border-white/5 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground">Pedido #{order.orderNumber}</span>
                    <span className="text-sm font-medium">{format(order.createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="text-right">
                    <Badge className={`${status.color} border py-1 px-3 uppercase text-[10px] tracking-widest font-bold`}>
                      <status.icon className="h-3 w-3 mr-1.5" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      {order.items.map((item, idx) => {
                        return (
                          <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="h-12 w-12 rounded bg-primary/20 flex items-center justify-center shrink-0">
                              {item.isDigital ? <FileCode className="h-6 w-6 text-accent" /> : <Printer className="h-6 w-6 text-primary" />}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-bold text-sm truncate">{item.title}</p>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                {item.isDigital ? "📦 Arquivo Digital" : "🛠️ Impressão Física"}
                              </p>
                            </div>
                            {isPaid && item.isDigital && item.digitalLink && (
                              <Button asChild size="sm" variant="ghost" className="text-accent hover:bg-accent/10">
                                <a href={item.digitalLink} target="_blank"><Download className="h-4 w-4" /></a>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Investido</p>
                       <p className="text-2xl font-headline text-primary">R$ {order.total.toFixed(2)}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button asChild className="w-full bg-primary hover:bg-primary/80">
                        <Link href={`/order-confirmation/${order.id}`}>
                           {isPaid ? "Status da Produção" : "Pagar Agora"}
                        </Link>
                      </Button>
                      
                      {order.status === 'shipped' && order.trackingLink && (
                        <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                          <a href={order.trackingLink} target="_blank">
                            <Truck className="h-4 w-4 mr-2" /> Rastrear Envio
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.status === 'paid' && !order.items.some(i => i.isDigital) && (
                    <div className="mt-6 p-4 bg-accent/5 rounded-xl border border-accent/20 flex items-center gap-3">
                      <div className="p-2 rounded-full bg-accent/10">
                        <AlertCircle className="h-4 w-4 text-accent" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sua peça está sendo preparada com carinho por nossa equipe técnica e logo entrará na fila de fatiamento.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-24 bg-secondary/10 rounded-2xl border border-dashed border-white/10">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-semibold text-muted-foreground">Você ainda não realizou nenhum pedido 3D.</p>
            <Button asChild className="mt-6 bg-primary"><Link href="/products">Ver Catálogo Zyntra</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
