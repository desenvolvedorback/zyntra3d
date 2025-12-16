import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewsForm } from "@/components/admin/news/NewsForm";
import type { News } from "@/lib/types";

async function getNews(id: string) {
  const docRef = doc(db, "news", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as News;
  }
  return null;
}

export default async function EditNewsPage({ params }: { params: { id: string } }) {
  const news = await getNews(params.id);

  if (!news) {
    return <div>News not found.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Edit News Article</h1>
      <NewsForm initialData={news} />
    </div>
  );
}
