import { NewsForm } from "@/components/admin/news/NewsForm";

export default function NewNewsPage() {
  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Adicionar Nova Notícia</h1>
      <NewsForm />
    </div>
  );
}
