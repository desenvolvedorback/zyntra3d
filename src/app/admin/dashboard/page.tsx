import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Newspaper, Package } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const newsSnapshot = await getDocs(collection(db, "news"));
    
    const productCount = productsSnapshot.size;
    const newsCount = newsSnapshot.size;

    return { productCount, newsCount };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { productCount: 0, newsCount: 0 };
  }
}


export default async function AdminDashboardPage() {
  const { productCount, newsCount } = await getStats();

  return (
    <div>
      <h1 className="text-3xl font-headline text-primary mb-6">Painel Administrativo</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, Admin!</CardTitle>
            <CardDescription>
              Este é o seu centro de controle para a Doce Sabor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>A partir daqui, você pode gerenciar produtos, visualizar pedidos e atualizar notícias para a página inicial.</p>
            <p className="mt-4 text-sm text-muted-foreground">Use a navegação acima para começar.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
            <CardDescription>
              Uma visão rápida do desempenho da sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{productCount}</p>
                  <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
                </div>
              </div>
              <div className="flex items-center">
                <Newspaper className="h-6 w-6 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{newsCount}</p>
                  <p className="text-sm text-muted-foreground">Artigos de Notícias</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
