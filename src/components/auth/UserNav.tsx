
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, LogOut, User as UserIcon, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export function UserNav() {
  const { user, userProfile, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!isClient || loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
        <Link href="/login">Entrar</Link>
      </Button>
    );
  }
  
  const displayName = userProfile?.displayName || user.displayName || "Maker";
  const email = userProfile?.email || user.email || "";
  const photoURL = user.photoURL || undefined;

  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || email.charAt(0).toUpperCase() || 'Z';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
          <Avatar className="h-10 w-10">
            <AvatarImage src={photoURL} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-white/5" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-primary">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
            <Link href="/profile" className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4 text-accent" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
            <Link href="/my-orders" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4 text-accent" />
              <span>Meus Pedidos</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
              <Link href="/admin/dashboard" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4 text-accent" />
                <span>Painel Admin</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair da Oficina</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
