'use client';

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewsForm } from "@/components/admin/news/NewsForm";
import type { News } from "@/lib/types";
import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";

export default function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getNews() {
      try {
        const docRef = doc(db, "news", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNews({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as News);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    }
    getNews();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!news) {
    return <div>Notícia não encontrada.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Editar Notícia</h1>
      <NewsForm initialData={news} />
    </div>
  );
}
