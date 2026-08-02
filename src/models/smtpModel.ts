import { db } from '../lib/firebase-admin';

export interface SMTPConfig {
  user: string;
  pass: string;
  host?: string;
  port?: number;
  secure?: boolean;
}

const COLLECTION_NAME = 'config';
const DOC_ID = 'smtp';

export async function getSMTPConfig(): Promise<SMTPConfig> {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(DOC_ID);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      const defaultConfig: SMTPConfig = { user: '', pass: '' };
      await saveSMTPConfig(defaultConfig);
      return defaultConfig;
    }
    
    return doc.data() as SMTPConfig;
  } catch (error: any) {
    console.error('Erro ao ler configuração SMTP do Firestore:', error);
    throw new Error('Falha ao obter configurações SMTP.');
  }
}

export async function saveSMTPConfig(config: SMTPConfig): Promise<void> {
  try {
    const fullConfig: SMTPConfig = {
      user: config.user || '',
      pass: config.pass || '',
      host: config.host || 'smtp.gmail.com',
      port: config.port || 465,
      secure: config.secure !== undefined ? config.secure : true,
    };
    
    const docRef = db.collection(COLLECTION_NAME).doc(DOC_ID);
    await docRef.set(fullConfig);
  } catch (error) {
    console.error('Erro ao escrever configuração SMTP no Firestore:', error);
    throw new Error('Falha ao salvar configurações SMTP.');
  }
}
