import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;

try {
  app = getApps().length === 0 ? initializeApp() : getApp();
} catch (error) {
  console.warn('Aviso: Firebase Admin falhou na inicialização (Isso é normal durante o build do Next.js se não houver credenciais).');
}

let db: any;
try {
  db = getFirestore(app as any);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (settingError: any) {
    if (!settingError.message?.includes('already been initialized')) {
      throw settingError;
    }
  }
} catch (error) {
  console.error('Firebase Admin Error na inicialização do Firestore:', error);
  // Retorna um mock vazio para não quebrar o build do Next.js
  const mockQuery = {
    get: async () => ({ docs: [], empty: true }),
    orderBy: () => mockQuery,
    where: () => mockQuery,
    limit: () => mockQuery,
  };
  db = {
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: false }), set: async () => {}, update: async () => {}, delete: async () => {} }),
      ...mockQuery
    })
  } as any;
}

export { db };
