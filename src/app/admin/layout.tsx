import Link from "next/link";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/auth/UserNav";
import { Button } from "@/components/ui/button";

function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 max-w-7xl items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
          <p className="font-headline text-lg text-primary/80 ml-2">Admin</p>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/admin/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Painel
          </Link>
          <Link href="/admin/products" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Produtos
          </Link>
          <Link href="/admin/news" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Notícias
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
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
        <main className="flex-grow container max-w-7xl mx-auto py-8">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
