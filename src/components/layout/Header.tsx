"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/auth/UserNav";
import { CartSheet } from "@/components/cart/CartSheet";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const { isAdmin } = useAuth();
  const navItems = [
    { href: "/", label: "Início" },
    { href: "/products", label: "Doces" },
    { href: "/about", label: "Sobre" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 max-w-7xl items-center">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs pr-6">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b pb-4">
                  <Logo />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-6 w-6" />
                      <span className="sr-only">Fechar</span>
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-y-4 pt-6 text-lg">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className="rounded-md bg-primary/10 px-3 py-2 font-semibold text-primary transition-colors hover:bg-primary/20"
                      >
                        Painel
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:space-x-6 md:ml-10 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="transition-colors hover:text-foreground/80 text-foreground font-semibold">
              Painel
            </Link>
          )}
        </nav>
        
        {/* Mobile Logo (Center) */}
        <div className="flex-1 flex justify-center md:hidden">
           <Logo className="!h-12 !w-24"/>
        </div>


        <div className="flex items-center justify-end space-x-2 md:space-x-4 md:flex-1">
          <CartSheet />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
