"use server";

import { revalidatePath } from "next/cache";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const profileUpdateSchema = z.object({
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cpf: z.string().length(14, "O CPF deve ter o formato 000.000.000-00."),
  phone: z.string().min(14, "O telefone deve ter o formato (00) 00000-0000."),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export async function updateUserProfile(uid: string, data: ProfileUpdateData) {
  // A validação do UID já aconteceu na API Route antes de chamar esta ação.
  // A função `getAuthenticatedUser` garantiu que o UID pertence ao autor da chamada.

  // 1. Validar os dados recebidos
  const validation = profileUpdateSchema.safeParse(data);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(', ');
    throw new Error(`Dados inválidos: ${errorMessages}`);
  }

  const { displayName, cpf, phone } = validation.data;

  // 2. Atualizar o perfil no Firestore usando o UID verificado
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    displayName,
    cpf,
    phone,
  });

  revalidatePath("/profile");

  return { success: true, message: "Perfil atualizado com sucesso!" };
}
