
'use client';

import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { News } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as News));
        setNews(list);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
    </div>
  );

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="max-w-4xl mx-auto mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-headline text-primary mb-6">Zyntra Insights</h1>
        <p className="text-xl text-muted-foreground font-alegreya">
          Fique por dentro das últimas tecnologias de impressão 3D, novos projetos e atualizações da nossa oficina.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {news.length > 0 ? (
          news.map((article) => (
            <Card key={article.id} className="bg-secondary/20 border-white/5 overflow-hidden group hover:border-primary/50 transition-all flex flex-col">
              <Link href={`/news/${article.id}`} className="block relative h-56 overflow-hidden">
                <Image
                  src={article.imageUrl || "https://images2.imgbox.com/e1/73/NCTdPsgZ_o.png"}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint={article.imageHint || "technology"}
                />
              </Link>
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-2 text-xs text-accent font-bold mb-3 uppercase tracking-tighter">
                  <Calendar className="h-3 w-3" />
                  {format(article.createdAt, "d 'de' MMMM", { locale: ptBR })}
                </div>
                <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors line-clamp-2">
                  <Link href={`/news/${article.id}`}>{article.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 font-alegreya">
                  {article.content}
                </p>
                <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn">
                  <Link href={`/news/${article.id}`} className="flex items-center gap-2">
                    Continuar Lendo <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-white/10">
            <p className="text-muted-foreground">O blog está sendo renderizado. Volte em breve!</p>
          </div>
        )}
      </div>
    </div>
  );
}
