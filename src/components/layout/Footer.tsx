
import { Logo } from "@/components/shared/Logo";
import { ShieldCheck, Cpu, Zap, Printer } from "lucide-react";
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span>Checkout Seguro Mercado Pago</span>
              </div>
              <div className="pt-2">
                <a href="https://zyntra-scan.onrender.com" target="_blank" rel="noopener noreferrer" className="inline-block transition-opacity hover:opacity-80">
                  <img src="https://img.shields.io/badge/Analisado%20com-Zyntra%20Scan-0c4a6e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3ZGQzZmMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTB6Ij48L3BhdGg+PC9zdmc+" alt="Analisado com Zyntra Scan" />
                </a>
              </div>
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
