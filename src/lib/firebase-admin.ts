import * as admin from 'firebase-admin';

// Verifica se a variável de ambiente está definida
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.warn(
    'A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida. A verificação de token no servidor falhará.'
  );
}

// Verifica se já existe uma instância do app para evitar reinicialização
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não está presente no ambiente.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('Falha ao inicializar o Firebase Admin SDK:', e);
  }
}

// Exporta a instância do admin para ser usada em outras partes do servidor
export const adminAuth = admin.apps.length ? admin.auth() : null;
