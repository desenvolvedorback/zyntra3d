
"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/auth/UserNav";
import { CartSheet } from "@/components/cart/CartSheet";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, Package, Info, Home, Newspaper } from "lucide-react";

export function Header() {
  const { isAdmin } = useAuth();
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Modelos & Serviços", icon: Package },
    { href: "/news", label: "Novidades", icon: Newspaper },
    { href: "/about", label: "Tecnologia", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 max-w-7xl items-center px-6">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs bg-card">
                <SheetHeader>
                    <SheetTitle className="sr-only">Menu Zyntra 3D</SheetTitle>
                </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <Logo className="!h-10 !w-24" />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon"><X className="h-6 w-6" /></Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-y-4 pt-8">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 rounded-md px-4 py-3 text-lg font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link href="/my-orders" className="flex items-center gap-4 rounded-md px-4 py-3 text-lg font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all">
                      <Package className="h-5 w-5" /> Meus Pedidos
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center space-x-8 ml-12 text-sm font-semibold uppercase tracking-wider">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="text-accent hover:text-accent/80 font-bold border-l border-white/10 pl-8">
              Admin Zyntra
            </Link>
          )}
        </nav>
        
        <div className="flex-1 md:hidden flex justify-center">
          <span className="font-headline text-2xl gradient-text">ZYNTRA 3D</span>
        </div>

        <div className="flex items-center justify-end space-x-3 md:flex-1">
          <CartSheet />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
