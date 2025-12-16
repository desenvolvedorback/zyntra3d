import { ProductForm } from "@/components/admin/products/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-3xl font-headline mb-6 text-primary">Add New Product</h1>
      <ProductForm />
    </div>
  );
}
