import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
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
             <p className="text-muted-foreground">As estatísticas serão mostradas aqui.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
