import fs from 'fs/promises';
import path from 'path';

export interface SMTPConfig {
  user: string;
  pass: string;
  host?: string;
  port?: number;
  secure?: boolean;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/smtp.json');

export async function getSMTPConfig(): Promise<SMTPConfig> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    const content = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    if (!content.trim()) return { user: '', pass: '' };
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const defaultConfig: SMTPConfig = { user: '', pass: '' };
      await saveSMTPConfig(defaultConfig);
      return defaultConfig;
    }
    console.error('Erro ao ler configuração SMTP:', error);
    throw new Error('Falha ao obter configurações SMTP.');
  }
}

export async function saveSMTPConfig(config: SMTPConfig): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    // Configura padrões para o Gmail caso não especificados
    const fullConfig: SMTPConfig = {
      user: config.user || '',
      pass: config.pass || '',
      host: config.host || 'smtp.gmail.com',
      port: config.port || 465,
      secure: config.secure !== undefined ? config.secure : true,
    };
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(fullConfig, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao escrever configuração SMTP:', error);
    throw new Error('Falha ao salvar configurações SMTP.');
  }
}
