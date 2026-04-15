
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles, Link as LinkIcon } from "lucide-react";

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

const DEFAULT_IMAGE_URL = "https://picsum.photos/seed/3d/600/600";

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
      digitalLink: initialData.digitalLink || "",
    } : {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      imageUrl: "",
      imageHint: "",
      digitalLink: "",
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
      const result = await generateProductDescription({ title, keywords: "impressão 3d, precisão, material premium" });
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
        description: "Não foi possível gerar a descrição.",
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
      payload.imageHint = data.category;

      if (initialData) {
        await updateProduct(initialData.id, payload);
        toast({ title: "Sucesso", description: "Produto atualizado com sucesso." });
      } else {
        await addProduct(payload);
        toast({ title: "Sucesso", description: "Produto criado com sucesso." });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
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
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle>Detalhes da Engenharia</CardTitle>
                <CardDescription>Defina as especificações técnicas do seu item 3D.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Action Figure Articulado" {...field} disabled={loading} className="bg-background/50" />
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
                        <FormLabel>Descrição Técnica</FormLabel>
                         <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={aiLoading} className="text-accent hover:text-accent/80">
                           {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                           <span className="ml-2">Otimizar com IA</span>
                         </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Descreva materiais, densidade de preenchimento e resolução recomendada..." {...field} rows={10} disabled={loading || aiLoading} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle>Recursos Digitais</CardTitle>
                <CardDescription>Links para download ou arquivos originais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="digitalLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link do Arquivo (ZIP/STL/OBJ)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://drive.google.com/..." {...field} disabled={loading} className="bg-background/50" />
                      </FormControl>
                      <FormDescription>Se preenchido, o link será liberado automaticamente após o pagamento.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Preview/Foto</FormLabel>
                      <FormControl>
                        <Input placeholder={DEFAULT_IMAGE_URL} {...field} disabled={loading} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle>Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} disabled={loading} className="bg-background/50" />
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
                      <FormLabel>Unidades Disponíveis</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} disabled={loading} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle>Logística</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Projeto</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Personalizados" {...field} disabled={loading} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator className="opacity-10" />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/80">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Atualizar Projeto" : "Publicar na Oficina"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
