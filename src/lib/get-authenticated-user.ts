import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

// Esta função deve ser chamada dentro de uma Server Action ou Route Handler
export const getAuthenticatedUser = async () => {
  const authorization = headers().get("Authorization");

  if (!authorization) {
    throw new Error("Não autorizado: Nenhum token fornecido.");
  }

  if (!adminAuth) {
    throw new Error("Firebase Admin não inicializado. Verifique as credenciais do servidor.");
  }

  try {
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, token: decodedToken };
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    throw new Error("Não autorizado: Token inválido ou expirado.");
  }
};
