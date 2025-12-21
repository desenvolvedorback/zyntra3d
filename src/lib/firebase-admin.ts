import * as admin from 'firebase-admin';

// Verifica se a variável de ambiente está definida
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Em um ambiente de desenvolvimento, isso pode ser um aviso em vez de um erro fatal,
  // mas para produção, é crucial.
  console.warn(
    'A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida. Funções de admin podem falhar.'
  );
}

// Verifica se já existe uma instância do app para evitar reinicialização
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('Falha ao inicializar o Firebase Admin SDK:', e);
    // Dependendo do seu caso de uso, você pode querer lançar o erro aqui
    // throw new Error("Could not initialize Firebase Admin SDK.");
  }
}

// Exporta a instância do admin para ser usada em outras partes do servidor
export const adminAuth = admin.apps.length ? admin.auth() : null;
