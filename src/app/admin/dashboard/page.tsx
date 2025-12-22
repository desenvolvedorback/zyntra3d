'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Newspaper, Package, ShoppingCart } from "lucide-react";
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
}

async function getStats(period: Period): Promise<Stats> {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const newsSnapshot = await getDocs(collection(db, "news"));
    
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
      case 'all_time':
        // No date filter needed
        break;
    }

    let ordersQuery = query(collection(db, "orders"), where("status", "==", "paid"));

    if (startDate) {
        ordersQuery = query(ordersQuery, where("createdAt", ">=", startDate));
    }
    if (endDate) {
        ordersQuery = query(ordersQuery, where("createdAt", "<=", endDate));
    }

    const ordersSnapshot = await getDocs(ordersQuery);

    const productCount = productsSnapshot.size;
    const newsCount = newsSnapshot.size;
    const orderCount = ordersSnapshot.size;
    const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

    return { productCount, newsCount, orderCount, totalRevenue };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { productCount: 0, newsCount: 0, orderCount: 0, totalRevenue: 0 };
  }
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const newStats = await getStats(period);
      setStats(newStats);
      setLoading(false);
    };

    fetchStats();
  }, [period]);

  const periodLabels = useMemo(() => ({
    this_month: 'Este Mês',
    last_month: 'Mês Passado',
    this_year: 'Este Ano',
    all_time: 'Todo o Período',
  }), []);

  const renderStats = () => {
    if (loading || !stats) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <div className="col-span-full">
            <Skeleton className="h-24" />
          </div>
        </div>
      )
    }

    return (
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center p-4 bg-muted/50 rounded-lg">
          <ShoppingCart className="h-7 w-7 text-primary mr-4" />
          <div>
            <p className="text-2xl font-bold">{stats.orderCount}</p>
            <p className="text-sm text-muted-foreground">Pedidos Pagos</p>
          </div>
        </div>
         <div className="flex items-center p-4 bg-muted/50 rounded-lg">
          <Package className="h-7 w-7 text-primary mr-4" />
          <div>
            <p className="text-2xl font-bold">{stats.productCount}</p>
            <p className="text-sm text-muted-foreground">Produtos</p>
          </div>
        </div>
        <div className="flex items-center p-4 bg-muted/50 rounded-lg">
          <Newspaper className="h-7 w-7 text-primary mr-4" />
          <div>
            <p className="text-2xl font-bold">{stats.newsCount}</p>
            <p className="text-sm text-muted-foreground">Notícias</p>
          </div>
        </div>
         <div className="col-span-full flex items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-4xl mr-4">💰</span>
            <div>
               <p className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
               <p className="text-sm text-muted-foreground">Receita ({periodLabels[period]})</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-headline text-primary mb-6">Painel Administrativo</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <AdminWelcome />
            <CardDescription>
              Este é o seu centro de controle para a Doce Sabor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Use a navegação para gerenciar o site e veja as estatísticas ao lado.</p>
             <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Período das estatísticas</label>
                 <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_month">Este Mês</SelectItem>
                        <SelectItem value="last_month">Mês Passado</SelectItem>
                        <SelectItem value="this_year">Este Ano</SelectItem>
                        <SelectItem value="all_time">Todo o Período</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
            <CardDescription>
              Uma visão do desempenho da sua loja para o período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {renderStats()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
