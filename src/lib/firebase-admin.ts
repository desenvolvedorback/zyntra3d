import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
    throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
}

// Verifica se já existe uma instância do app para evitar reinicialização
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
    } catch (e) {
        console.error('Falha ao inicializar o Firebase Admin SDK:', e);
    }
}

export const adminApp = admin.apps[0];
