"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { promotionSchema } from "@/lib/promotion-schema";
import type { z } from "zod";

type PromotionFormValues = z.infer<typeof promotionSchema>;

export async function addPromotion(data: PromotionFormValues) {
  const validation = promotionSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }

  const promotionCollection = collection(db, "promotions");
  await addDoc(promotionCollection, {
    ...validation.data,
    createdAt: serverTimestamp(),
  });

  revalidateAll();
}

export async function updatePromotion(id: string, data: PromotionFormValues) {
  const validation = promotionSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }

  const docRef = doc(db, "promotions", id);
  await updateDoc(docRef, validation.data);
  
  revalidateAll();
}

export async function deletePromotion(id: string) {
  const docRef = doc(db, "promotions", id);
  await deleteDoc(docRef);

  revalidateAll();
}

// Revalidate all relevant paths
function revalidateAll() {
  revalidatePath("/admin/promotions");
  revalidatePath("/products");
  revalidatePath("/");
}
