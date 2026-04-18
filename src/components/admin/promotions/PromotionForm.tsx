
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Promotion, Product } from "@/lib/types";
import { promotionSchema } from "@/lib/promotion-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PromotionFormValues = z.infer<typeof promotionSchema>;

interface PromotionFormProps {
  initialData?: Promotion;
  products: Product[];
}

export function PromotionForm({ initialData, products }: PromotionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: initialData || {
      name: "",
      type: "product",
      discountType: "percentage",
      discountValue: 0,
      productId: "",
      isActive: true,
    },
  });

  const promotionType = form.watch("type");

  const onSubmit = async (data: PromotionFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        const promoRef = doc(db, "promotions", initialData.id);
        await updateDoc(promoRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Sucesso", description: "Promoção atualizada com sucesso." });
      } else {
        const promosCollection = collection(db, "promotions");
        await addDoc(promosCollection, {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Sucesso", description: "Promoção criada com sucesso." });
      }
      
      // Pequeno delay para garantir que o Firestore atualizou antes de redirecionar
      setTimeout(() => {
        router.push("/admin/promotions");
        router.refresh();
      }, 500);

    } catch (error: any) {
      console.error("Erro ao salvar promoção:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Algo deu errado. Verifique suas permissões de administrador.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-secondary/10 border-white/5 shadow-xl">
      <CardHeader>
        <CardTitle className="text-primary font-headline text-2xl">{initialData ? "Editar Promoção" : "Criar Promoção"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Promoção</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Queima de Estoque" {...field} disabled={loading} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/30">
                    <div className="space-y-0.5">
                      <FormLabel>Ativar Promoção</FormLabel>
                      <FormDescription>
                        Marque para ativar esta promoção no site.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Promoção</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="product">Produto Específico</SelectItem>
                        <SelectItem value="delivery">Taxa de Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {promotionType === 'product' && (
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto Alvo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione o tipo de desconto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Desconto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="ex: 10 para 10% ou 5 para R$5,00" {...field} disabled={loading} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="opacity-10"/>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/80 px-8">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Promoção"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
