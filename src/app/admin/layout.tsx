import Link from "next/link";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/auth/UserNav";
import { Button } from "@/components/ui/button";
import { Menu, Newspaper, Package, PanelsTopLeft, ShoppingCart, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function AdminHeader() {
  const navItems = [
    { href: "/admin/dashboard", label: "Painel", icon: PanelsTopLeft },
    { href: "/admin/products", label: "Produtos", icon: Package },
    { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/admin/news", label: "Notícias", icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 max-w-7xl items-center">
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
              <SheetHeader>
                  <SheetTitle className="sr-only">Menu Admin</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <Logo className="!h-12 !w-24" />
                    <p className="font-headline text-lg text-primary/80 ml-2">Admin</p>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-6 w-6" />
                      <span className="sr-only">Fechar</span>
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-y-2 pt-6 text-lg">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-muted"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Header */}
        <div className="mr-4 hidden md:flex items-center">
          <Logo />
          <p className="font-headline text-lg text-primary/80 ml-2">Admin</p>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map(item => (
             <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Mobile Title (Centered) */}
        <div className="flex-1 flex justify-center md:hidden items-center">
          <p className="font-headline text-xl text-primary/80">Admin</p>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">Ver Site</Link>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow container max-w-7xl mx-auto py-6 px-4 md:px-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
