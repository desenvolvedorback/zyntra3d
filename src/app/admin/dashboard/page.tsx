
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Newspaper, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { AdminWelcome } from "@/components/admin/AdminWelcome";
import { useEffect, useState, useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type Period = 'this_month' | 'last_month' | 'this_year' | 'all_time';

interface Stats {
  productCount: number;
  newsCount: number;
  orderCount: number;
  totalRevenue: number;
  customerCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [productsSnap, newsSnap, ordersSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "news")),
          getDocs(query(collection(db, "orders"), where("status", "in", ["paid", "delivered", "shipped"]))),
          getDocs(collection(db, "users"))
        ]);

        const allOrders = ordersSnap.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (period) {
          case 'this_month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'last_month':
            const lastMonth = subMonths(now, 1);
            startDate = startOfMonth(lastMonth);
            endDate = endOfMonth(lastMonth);
            break;
          case 'this_year':
            startDate = startOfYear(now);
            break;
        }

        const filteredOrders = allOrders.filter(order => {
          if (!startDate) return true;
          const orderDate = order.createdAt;
          if (endDate) return orderDate >= startDate && orderDate <= endDate;
          return orderDate >= startDate;
        });

        setStats({
          productCount: productsSnap.size,
          newsCount: newsSnap.size,
          orderCount: filteredOrders.length,
          totalRevenue: filteredOrders.reduce((sum, doc: any) => sum + (doc.total || 0), 0),
          customerCount: usersSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const cards = [
    { label: "Vendas Confirmadas", value: stats?.orderCount, icon: ShoppingCart, color: "text-green-500" },
    { label: "Projetos Ativos", value: stats?.productCount, icon: Package, color: "text-blue-500" },
    { label: "Clientes Base", value: stats?.customerCount, icon: Users, color: "text-purple-500" },
    { label: "Notícias", value: stats?.newsCount, icon: Newspaper, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline text-primary">Painel Zyntra 3D</h1>
          <AdminWelcome />
        </div>
        <div className="w-full md:w-48">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="bg-background/50 border-white/10">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="this_year">Este Ano</SelectItem>
              <SelectItem value="all_time">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          cards.map((card, i) => (
            <Card key={i} className="bg-secondary/20 border-white/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <card.icon className="h-16 w-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-widest">{card.label}</CardDescription>
                <CardTitle className="text-3xl font-bold">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-xs ${card.color}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>Em crescimento</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-primary/5 border-primary/20 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline text-primary">Receita Bruta</CardTitle>
            <CardDescription>Consolidado de pagamentos aprovados</CardDescription>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">R$ {stats?.totalRevenue.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">no período selecionado</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
