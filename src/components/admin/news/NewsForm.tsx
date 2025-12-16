"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { News } from "@/lib/types";
import { newsSchema } from "@/lib/news-schema";
import { addNewsArticle, updateNewsArticle } from "@/lib/actions/newsActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type NewsFormValues = z.infer<typeof newsSchema>;

interface NewsFormProps {
  initialData?: News;
}

const DEFAULT_IMAGE_URL = "https://files.catbox.moe/9m67rz.png";

export function NewsForm({ initialData }: NewsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      imageUrl: "",
      imageHint: "",
    },
  });

  const onSubmit = async (data: NewsFormValues) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (!payload.imageUrl) {
        payload.imageUrl = DEFAULT_IMAGE_URL;
      }

      if (initialData) {
        await updateNewsArticle(initialData.id, payload);
        toast({ title: "Sucesso", description: "Notícia atualizada." });
      } else {
        await addNewsArticle(payload);
        toast({ title: "Sucesso", description: "Notícia criada." });
      }
      router.push("/admin/news");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo deu errado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Editar Artigo" : "Criar Artigo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Anúncio Especial de Verão" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Conteúdo completo da notícia..." {...field} rows={8} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder={DEFAULT_IMAGE_URL} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dica de Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: 'assando cookies'" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Artigo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
