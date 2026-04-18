'use client';

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { News } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      try {
        const docRef = doc(db, "news", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticle({
            id: docSnap.id,
            title: data.title || "",
            content: data.content || "",
            imageUrl: data.imageUrl || "",
            imageHint: data.imageHint || "",
            createdAt: data.createdAt?.toDate() || new Date(),
          } as News);
        }
      } catch (error) {
        console.error("Erro ao buscar artigo:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href,
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copiado!", description: "Link da notícia copiado para sua área de transferência." });
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
    </div>
  );

  if (!article) return (
    <div className="container py-20 text-center">
      <h2 className="text-2xl font-headline mb-4">Artigo não encontrado</h2>
      <Button onClick={() => router.push('/news')}>Voltar para Novidades</Button>
    </div>
  );

  return (
    <article className="container mx-auto max-w-4xl py-12 px-6">
      <Button variant="ghost" onClick={() => router.push('/news')} className="mb-8 hover:bg-white/5 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Blog
      </Button>

      <div className="space-y-6 mb-12">
        <div className="flex items-center gap-4 text-sm text-accent font-bold uppercase tracking-widest">
           <Calendar className="h-4 w-4" />
           {format(article.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <h1 className="text-4xl md:text-6xl font-headline text-primary leading-tight">{article.title}</h1>
        <div className="flex items-center justify-between border-y border-white/5 py-4">
           <span className="text-sm text-muted-foreground">Escrito pela Equipe Zyntra 3D</span>
           <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 border-white/10">
             <Share2 className="h-4 w-4" /> Compartilhar
           </Button>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12 border border-white/5 shadow-2xl">
        <Image
          src={article.imageUrl || "https://files.catbox.moe/9m67rz.png"}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="prose prose-invert max-w-none font-alegreya text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {article.content}
      </div>

      <div className="mt-20 pt-10 border-t border-white/5 text-center">
         <h3 className="font-headline text-3xl text-primary mb-4">Interessado nesta tecnologia?</h3>
         <p className="text-muted-foreground mb-8">Nossa oficina está pronta para materializar seu próximo projeto.</p>
         <Button asChild size="lg" className="bg-primary hover:bg-primary/80 px-10">
           <Link href="/products">Ver Catálogo de Serviços</Link>
         </Button>
      </div>
    </article>
  );
}