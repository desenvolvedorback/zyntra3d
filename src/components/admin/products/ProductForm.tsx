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
      imageUrl: "",
      imageHint: "",
    },
  });

  const handleGenerateDescription = async () => {
    const title = form.getValues("name");
    if (!title) {
      toast({
        variant: "destructive",
        title: "Product Name Required",
        description: "Please enter a product name to generate a description.",
      });
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateProductDescription({ title, keywords: "" });
      if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({
          title: "Description Generated!",
          description: "The AI-powered description has been added.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate description. Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateProduct(initialData.id, data);
        toast({ title: "Success", description: "Product updated." });
      } else {
        await addProduct(data);
        toast({ title: "Success", description: "Product created." });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
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
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Main information about the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chocolate Fudge Cake" {...field} disabled={loading} />
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
                        <FormLabel>Description</FormLabel>
                         <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={aiLoading}>
                           {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                           <span className="ml-2">Generate with AI</span>
                         </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Describe the product..." {...field} rows={10} disabled={loading || aiLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Product image settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://picsum.photos/seed/..." {...field} disabled={loading} />
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
                      <FormLabel>Image Hint</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 'chocolate cake'" {...field} disabled={loading} />
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
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
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
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} disabled={loading} />
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
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
