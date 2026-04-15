
import { Logo } from "@/components/shared/Logo";
import { ShieldCheck, Cpu, Zap, Printer } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 mt-auto">
      <div className="container max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transformando arquivos digitais em realidade física com a mais alta precisão e tecnologia de impressão 3D em Botucatu-SP pela Zyntra 3D.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline text-lg text-primary">Serviços</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Prototipagem Rápida</li>
              <li>Peças de Engenharia</li>
              <li>Miniaturas & Colecionáveis</li>
              <li>Consultoria em Projetos 3D</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline text-lg text-primary">Tecnologias</h4>
            <div className="flex gap-4">
              <Printer className="h-6 w-6 text-accent" />
              <Cpu className="h-6 w-6 text-accent" />
              <Zap className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline text-lg text-primary">Segurança</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>Checkout Seguro Mercado Pago</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Zyntra 3D Workshop. Botucatu - SP.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
