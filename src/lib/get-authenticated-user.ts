import { type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Esta função deve ser chamada dentro de uma Rota de API
export const getAuthenticatedUser = async (request: NextRequest) => {
  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    throw new Error("Não autorizado: Nenhum token fornecido.");
  }

  if (!adminAuth) {
    throw new Error("Firebase Admin não inicializado. Verifique as credenciais do servidor.");
  }

  try {
    const idToken = authorization.split("Bearer ")[1];
    if (!idToken) {
       throw new Error("Não autorizado: Token mal formatado.");
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error("Erro ao verificar token:", error.message);
    throw new Error("Não autorizado: Token inválido ou expirado.");
  }
};
