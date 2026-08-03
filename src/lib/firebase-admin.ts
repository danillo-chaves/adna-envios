import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;

try {
  app = getApps().length === 0 ? initializeApp() : getApp();
} catch (error) {
  console.warn('Aviso: Firebase Admin falhou na inicialização (Isso é normal durante o build do Next.js se não houver credenciais).');
}

let db;
try {
  db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
  // Retorna um mock vazio para não quebrar o build do Next.js
  db = {
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: false }), set: async () => {}, update: async () => {}, delete: async () => {} }),
      get: async () => ({ docs: [], empty: true })
    })
  } as any;
}

export { db };
