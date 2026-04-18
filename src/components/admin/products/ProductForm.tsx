
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles, Link as LinkIcon, FileCode, Box as BoxIcon } from "lucide-react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { productSchema } from "@/lib/product-schema";
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
      name: initialData.name,
      description: initialData.description,
      price: initialData.price,
      stock: initialData.stock,
      category: initialData.category,
      isDigital: initialData.isDigital || false,
      imageUrl: initialData.imageUrl,
      imageHint: initialData.imageHint,
      digitalLink: initialData.digitalLink || "",
    } : {
      name: "",
      description: "",
      price: 0,
      stock: 99,
      category: "Modelos Prontos",
      isDigital: false,
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
        const productRef = doc(db, "products", initialData.id);
        await updateDoc(productRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Sucesso", description: "Produto atualizado com sucesso." });
      } else {
        const productCollection = collection(db, "products");
        await addDoc(productCollection, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Sucesso", description: "Produto criado com sucesso." });
      }
      
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o produto no Zyntra 3D.",
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
                <CardTitle>Tipo de Produto e Entrega</CardTitle>
                <CardDescription>Configure como o cliente receberá este item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isDigital"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value ? <FileCode className="h-5 w-5 text-accent" /> : <BoxIcon className="h-5 w-5 text-primary" />}
                          {field.value ? "Produto Digital (Download)" : "Produto Físico (Impressão)"}
                        </FormLabel>
                        <FormDescription>
                          Produtos digitais liberam o link do Drive automaticamente após o pagamento.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isDigital") && (
                  <FormField
                    control={form.control}
                    name="digitalLink"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2">
                        <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link do Arquivo (ZIP/STL/OBJ)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} disabled={loading} className="bg-background/50" />
                        </FormControl>
                        <FormDescription>O link do Google Drive para o cliente baixar o pack ou arquivo.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={loading} className="bg-background/50" />
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
                      <FormLabel>Estoque Disponível</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="99" {...field} disabled={loading} className="bg-background/50" />
                      </FormControl>
                      <FormDescription>Para digitais, use um número alto (ex: 9999).</FormDescription>
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
