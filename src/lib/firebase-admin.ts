import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length === 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'envio-emails-notas'
    }) 
  : getApps().length > 0 ? getApp() : null;

// Se não houver credenciais, exporta um objeto fake em memória para não derrubar o Node.js e manter a UI funcionando
const mockStore: Record<string, any> = {};

const db = app ? getFirestore(app) : {
  collection: (colName: string) => { 
    if (Object.keys(mockStore).length === 0) {
      console.warn('⚠️ Firebase Admin não configurado. Usando banco de dados em memória temporário.');
    }
    return {
      doc: (docId: string = 'default') => {
        const path = `${colName}/${docId}`;
        return {
          get: async () => ({ 
            exists: !!mockStore[path], 
            data: () => mockStore[path] || {} 
          }),
          set: async (data: any) => { mockStore[path] = { ...mockStore[path], ...data }; },
          update: async (data: any) => { if (mockStore[path]) mockStore[path] = { ...mockStore[path], ...data }; },
          delete: async () => { delete mockStore[path]; }
        };
      },
      get: async () => {
        // Simple mock for fetching collections
        const docs = Object.keys(mockStore)
          .filter(k => k.startsWith(`${colName}/`))
          .map(k => ({ id: k.split('/')[1], data: () => mockStore[k] }));
        return { docs, empty: docs.length === 0 };
      }
    };
  },
  settings: () => {}
} as any;

if (app) {
  // Opcional: ignorar "undefined" no firestore (para campos não definidos)
  db.settings({ ignoreUndefinedProperties: true });
}

export { db };
