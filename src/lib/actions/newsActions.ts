"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { newsSchema } from "@/lib/news-schema";
import type { z } from "zod";

type NewsFormValues = z.infer<typeof newsSchema>;

export async function addNewsArticle(data: NewsFormValues) {
  const validation = newsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }

  const newsCollection = collection(db, "news");
  await addDoc(newsCollection, {
    ...validation.data,
    createdAt: serverTimestamp(),
  });

  revalidatePath("/admin/news");
  revalidatePath("/");
}

export async function updateNewsArticle(id: string, data: NewsFormValues) {
  const validation = newsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid data provided.");
  }

  const docRef = doc(db, "news", id);
  await updateDoc(docRef, validation.data);

  revalidatePath("/admin/news");
  revalidatePath("/");
}

export async function deleteNewsArticle(id: string) {
  const docRef = doc(db, "news", id);
  await deleteDoc(docRef);

  revalidatePath("/admin/news");
  revalidatePath("/");
}
