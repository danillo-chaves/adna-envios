import { db } from '../lib/firebase-admin';
import { Clinica } from './clinicaModel';

export interface Faltante {
  id?: string;
  clinica: Clinica;
  dataHora: string;
}

const COLLECTION_NAME = 'boletos_faltantes';

export async function readFaltantes(): Promise<Faltante[]> {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).orderBy('dataHora', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Faltante[];
  } catch (error) {
    console.error('Erro ao ler faltantes do Firestore:', error);
    throw error;
  }
}

export async function addFaltante(faltante: Omit<Faltante, 'id'>): Promise<string> {
  try {
    const docRef = await db.collection(COLLECTION_NAME).add(faltante);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar faltante no Firestore:', error);
    throw error;
  }
}

export async function addFaltantesEmLote(faltantes: Omit<Faltante, 'id'>[]): Promise<void> {
  if (!faltantes.length) return;
  try {
    const batch = db.batch();
    faltantes.forEach((faltante) => {
      const docRef = db.collection(COLLECTION_NAME).doc();
      batch.set(docRef, faltante);
    });
    await batch.commit();
  } catch (error) {
    console.error('Erro ao adicionar faltantes em lote no Firestore:', error);
    throw error;
  }
}

export async function deleteFaltante(id: string): Promise<void> {
  try {
    await db.collection(COLLECTION_NAME).doc(id).delete();
  } catch (error) {
    console.error('Erro ao deletar faltante no Firestore:', error);
    throw error;
  }
}
