
'use client';

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { News } from "@/lib/types";
import { NewsList } from "@/components/admin/news/NewsList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const newsCollection = collection(db, "news");
        const q = query(newsCollection, orderBy("createdAt", "desc"));
        const newsSnapshot = await getDocs(q);
        const newsList = newsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as News;
        });
        setNews(newsList);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline text-primary">Gerenciar Notícias</h1>
        <Button asChild>
          <Link href="/admin/news/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Notícia
          </Link>
        </Button>
      </div>
      <NewsList news={news} />
    </div>
  );
}
