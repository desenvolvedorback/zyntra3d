import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Newspaper, Package, ShoppingCart } from "lucide-react";
import { AdminWelcome } from "@/components/admin/AdminWelcome";

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const newsSnapshot = await getDocs(collection(db, "news"));
    
    const ordersQuery = query(collection(db, "orders"), where("status", "==", "paid"));
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


export default async function AdminDashboardPage() {
  const { productCount, newsCount, orderCount, totalRevenue } = await getStats();

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
            <p>A partir daqui, você pode gerenciar produtos, visualizar pedidos e atualizar notícias para a página inicial.</p>
            <p className="mt-4 text-sm text-muted-foreground">Use a navegação acima para começar.</p>
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
            <CardDescription>
              Uma visão rápida do desempenho da sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                <ShoppingCart className="h-7 w-7 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{orderCount}</p>
                  <p className="text-sm text-muted-foreground">Pedidos</p>
                </div>
              </div>
               <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                <Package className="h-7 w-7 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{productCount}</p>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                <Newspaper className="h-7 w-7 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{newsCount}</p>
                  <p className="text-sm text-muted-foreground">Notícias</p>
                </div>
              </div>
               <div className="col-span-full flex items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-4xl mr-4">💰</span>
                  <div>
                     <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
                     <p className="text-sm text-muted-foreground">Receita Total (Pedidos Pagos)</p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
