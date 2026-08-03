import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;

try {
  app = getApps().length === 0 ? initializeApp() : getApp();
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin:', error);
  console.error('Se estiver rodando localmente, não esqueça de exportar GOOGLE_APPLICATION_CREDENTIALS.');
}

const db = getFirestore(app);
if (app) {
  db.settings({ ignoreUndefinedProperties: true });
}

export { db };
