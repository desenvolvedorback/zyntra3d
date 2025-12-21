"use server";

import { revalidatePath } from "next/cache";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";

const profileUpdateSchema = z.object({
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cpf: z.string().length(14, "O CPF deve ter 11 dígitos."),
  phone: z.string().min(14, "O telefone deve ter pelo menos 10 dígitos."),
});

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export async function updateUserProfile(uid: string, data: ProfileUpdateValues) {
  try {
    const validation = profileUpdateSchema.safeParse(data);

    if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => e.message).join(', ');
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }

    const { displayName, cpf, phone } = validation.data;

    // Atualizar perfil no Firestore
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      displayName,
      cpf,
      phone,
    });

    revalidatePath("/profile");

    return { success: true, message: "Perfil atualizado com sucesso!" };

  } catch (error: any) {
    return { success: false, message: error.message || "Falha ao atualizar o perfil." };
  }
}
