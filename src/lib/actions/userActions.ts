"use server";

import { revalidatePath } from "next/cache";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const profileUpdateSchema = z.object({
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cpf: z.string().length(14, "O CPF deve ter 11 dígitos."),
  phone: z.string().min(14, "O telefone deve ter pelo menos 10 dígitos."),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    // 1. Obter o UID do usuário autenticado de forma segura no servidor
    const { uid } = await getAuthenticatedUser();

    // 2. Validar os dados recebidos
    const validation = profileUpdateSchema.safeParse(data);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(e => e.message).join(', ');
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }

    const { displayName, cpf, phone } = validation.data;

    // 3. Atualizar o perfil no Firestore usando o UID verificado
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
