"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { productSchema } from "@/lib/product-schema";
import { addProduct, updateProduct } from "@/lib/actions/productActions";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
}

const DEFAULT_IMAGE_URL = "https://files.catbox.moe/9m67rz.png";

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      ...initialData,
      price: initialData.price,
      stock: initialData.stock,
    } : {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      imageUrl: "",
      imageHint: "",
    },
  });

  const handleGenerateDescription = async () => {
    const title = form.getValues("name");
    if (!title) {
      toast({
        variant: "destructive",
        title: "Nome do Produto Necessário",
        description: "Por favor, insira um nome de produto para gerar uma descrição.",
      });
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateProductDescription({ title, keywords: "" });
      if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({
          title: "Descrição Gerada!",
          description: "A descrição gerada por IA foi adicionada.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na Geração por IA",
        description: "Não foi possível gerar a descrição. Por favor, tente novamente.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (!payload.imageUrl) {
        payload.imageUrl = DEFAULT_IMAGE_URL;
      }
      
      // Use category as imageHint
      payload.imageHint = data.category;

      if (initialData) {
        await updateProduct(initialData.id, payload);
        toast({ title: "Sucesso", description: "Produto atualizado." });
      } else {
        await addProduct(payload);
        toast({ title: "Sucesso", description: "Produto criado." });
      }
      router.push("/admin/products");
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Produto</CardTitle>
                <CardDescription>Informações principais sobre o produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Bolo de Chocolate" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Descrição</FormLabel>
                         <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={aiLoading}>
                           {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                           <span className="ml-2">Gerar com IA</span>
                         </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Descreva o produto..." {...field} rows={10} disabled={loading || aiLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mídia</CardTitle>
                <CardDescription>Configurações de imagem do produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Preço & Estoque</CardTitle>
              </Header>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="19.99" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
              </Header>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Bolos" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
