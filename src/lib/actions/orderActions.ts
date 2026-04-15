
"use server";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";

export async function updateOrderStatus(orderId: string, status: OrderStatus, trackingLink?: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      trackingLink: trackingLink || null,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw new Error("Falha ao atualizar o status do pedido.");
  }
}
