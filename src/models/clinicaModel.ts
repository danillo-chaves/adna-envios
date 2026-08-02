import { db } from '../lib/firebase-admin';

export interface Clinica {
  idContrato: string;
  nome: string;
  cnpj: string;
  celular: string;
  email: string;
  ignorarEnvio: boolean;
  enviarWhatsapp?: boolean;
}

const COLLECTION_NAME = 'clinicas';

export async function readClinicas(): Promise<Clinica[]> {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    return snapshot.docs.map((doc: any) => doc.data() as Clinica);
  } catch (error) {
    console.error('Erro ao ler clínicas do Firestore:', error);
    throw new Error('Falha ao obter lista de clínicas.');
  }
}

export async function addClinica(clinica: Clinica): Promise<void> {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(clinica.idContrato);
    const doc = await docRef.get();
    if (doc.exists) {
      throw new Error(`Clínica com ID de contrato ${clinica.idContrato} já existe.`);
    }
    await docRef.set(clinica);
  } catch (error: any) {
    if (error.message.includes('já existe')) throw error;
    console.error('Erro ao adicionar clínica no Firestore:', error);
    throw new Error('Falha ao adicionar clínica.');
  }
}

export async function updateClinica(idContrato: string, data: Partial<Clinica>): Promise<Clinica> {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(idContrato);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Clínica com ID de contrato ${idContrato} não encontrada.`);
    }
    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Clinica;
  } catch (error: any) {
    if (error.message.includes('não encontrada')) throw error;
    console.error('Erro ao atualizar clínica no Firestore:', error);
    throw new Error('Falha ao atualizar clínica.');
  }
}

export async function deleteClinica(idContrato: string): Promise<void> {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(idContrato);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Clínica com ID de contrato ${idContrato} não encontrada.`);
    }
    await docRef.delete();
  } catch (error: any) {
    if (error.message.includes('não encontrada')) throw error;
    console.error('Erro ao excluir clínica no Firestore:', error);
    throw new Error('Falha ao excluir clínica.');
  }
}
