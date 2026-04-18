
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isClient]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!isClient || loading || !user || !userProfile) {
    return (
      <div className="container mx-auto py-12 md:py-20 px-6">
        <Card className="max-w-2xl mx-auto bg-card border-white/5">
          <CardHeader className="items-center text-center">
             <Skeleton className="h-24 w-24 rounded-full mx-auto" />
             <Skeleton className="h-8 w-48 mt-4 mx-auto" />
             <Skeleton className="h-4 w-64 mt-2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const userInitials = userProfile.displayName?.split(' ').map(n => n[0]).join('') || userProfile.email?.charAt(0).toUpperCase() || 'Z';

  return (
    <div className="container mx-auto py-12 md:py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-card/50 border-white/5 backdrop-blur-xl">
          <CardHeader className="items-center text-center pb-8 border-b border-white/5">
            <Avatar className="h-32 w-32 mb-6 text-4xl border-4 border-primary/20">
              <AvatarImage src={user.photoURL || undefined} alt={userProfile.displayName || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-4xl font-headline text-primary">{userProfile.displayName}</CardTitle>
            <CardDescription className="text-lg">{userProfile.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações de Registro</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-muted-foreground text-sm">Função</span>
                    <span className="font-semibold capitalize text-accent">{userProfile.role}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-muted-foreground text-sm">CPF</span>
                    <span className="font-semibold">{userProfile.cpf || "Não informado"}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-muted-foreground text-sm">Telefone</span>
                    <span className="font-semibold">{userProfile.phone || "Não informado"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Atalhos da Oficina</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button asChild variant="secondary" className="h-14 justify-start gap-4 text-lg">
                  <Link href="/my-orders">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    Meus Pedidos
                  </Link>
                </Button>
                <Button variant="outline" className="h-14 justify-start gap-4 text-lg border-white/10 hover:bg-white/5">
                  <Settings className="h-6 w-6 text-accent" />
                  Configurações
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="h-14 justify-start gap-4 text-lg text-destructive hover:bg-destructive/10">
                  <LogOut className="h-6 w-6" />
                  Sair da Conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
