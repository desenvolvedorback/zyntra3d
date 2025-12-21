import { Logo } from "@/components/shared/Logo";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-center gap-6 py-10 md:h-28 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo />
          <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
            © {new Date().getFullYear()} Doce Sabor. Todos os direitos reservados.
          </p>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <span>Pagamento Seguro via Mercado Pago</span>
        </div>
      </div>
    </footer>
  );
}
