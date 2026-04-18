
import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from "@/components/ui/toaster"
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { ZyntraBot } from '@/components/shared/ZyntraBot';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Zyntra 3D | Oficina de Impressão e Projetos 3D',
  description: 'Prototipagem, miniaturas e arquivos 3D com precisão industrial em Botucatu.',
  icons: {
    icon: 'https://files.catbox.moe/4my793.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="https://files.catbox.moe/4my793.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <Script 
          src="https://www.google.com/recaptcha/enterprise.js?render=6Lfcw7gsAAAAALfTGJxPHLwTEz48zEcO-2m6yLDi" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <ZyntraBot />
          <Toaster />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
