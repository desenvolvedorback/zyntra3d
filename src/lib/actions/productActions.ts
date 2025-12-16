"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { productSchema } from "@/lib/product-schema";
import type { z } from "zod";

type ProductFormValues = z.infer<typeof productSchema>;

export async function addProduct(data: ProductFormValues) {
  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }
  
  const productCollection = collection(db, "products");
  await addDoc(productCollection, {
    ...validation.data,
    createdAt: serverTimestamp(),
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, data: ProductFormValues) {
  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }

  const docRef = doc(db, "products", id);
  await updateDoc(docRef, validation.data);

  revalidatePath(`/admin/products`);
  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
  
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}
