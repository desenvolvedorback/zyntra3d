"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
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
    defaultValues: initialData ? {
      name: initialData.name,
      type: initialData.type,
      discountType: initialData.discountType,
      discountValue: initialData.discountValue,
      productId: initialData.productId || "",
      isActive: initialData.isActive,
    } : {
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
        toast({ title: "Sucesso", description: "Promoção atualizada." });
      } else {
        const promosCollection = collection(db, "promotions");
        await addDoc(promosCollection, {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Sucesso", description: "Promoção criada." });
      }
      router.push("/admin/promotions");
      router.refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-secondary/10 border-white/5">
      <CardHeader><CardTitle className="text-primary font-headline text-2xl">{initialData ? "Editar Promoção" : "Criar Promoção"}</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome da Promoção</FormLabel><FormControl><Input placeholder="Ex: Oferta de Natal" {...field} disabled={loading} className="bg-background/50" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/30">
                  <FormLabel>Ativar Promoção</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="product">Produto Específico</SelectItem><SelectItem value="delivery">Taxa de Entrega</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
              {promotionType === 'product' && (
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto Alvo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione um produto" /></SelectTrigger></FormControl>
                      <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="discountType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl><SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="percentage">Porcentagem (%)</SelectItem><SelectItem value="fixed">Valor Fixo (R$)</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="discountValue" render={({ field }) => (
                <FormItem><FormLabel>Valor do Desconto</FormLabel><FormControl><Input type="number" step="0.01" {...field} disabled={loading} className="bg-background/50" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Separator className="opacity-10"/>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-primary px-8">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {initialData ? "Salvar Alterações" : "Criar Promoção"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
