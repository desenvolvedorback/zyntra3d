import { ProductForm } from "@/components/admin/products/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Adicionar Novo Produto</h1>
      <ProductForm />
    </div>
  );
}
