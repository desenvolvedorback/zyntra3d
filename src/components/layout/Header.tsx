"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/auth/UserNav";
import { CartSheet } from "@/components/cart/CartSheet";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 max-w-7xl items-center">
        <Logo />
        <nav className="hidden md:flex md:items-center md:space-x-6 md:ml-10 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Início
          </Link>
          <Link href="/products" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Doces
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Sobre
          </Link>
          {isAdmin && (
            <Link href="/admin" className="transition-colors hover:text-foreground/80 text-foreground font-semibold">
              Painel
            </Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <CartSheet />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
