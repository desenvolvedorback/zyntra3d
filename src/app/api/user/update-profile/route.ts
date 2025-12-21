import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-authenticated-user';
import { updateUserProfile } from '@/lib/actions/userActions';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar a identidade do usuário de forma segura
    const { uid } = await getAuthenticatedUser(request);

    // 2. Obter os dados do corpo da requisição
    const body = await request.json();

    // 3. Chamar a Server Action, passando o UID verificado e os dados
    const result = await updateUserProfile(uid, body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error.message);
    // Retorna uma resposta de erro padronizada
    return NextResponse.json(
      { success: false, message: error.message || 'Falha na operação.' },
      { status: 400 } // 400 Bad Request ou 401 Unauthorized dependendo do erro
    );
  }
}
