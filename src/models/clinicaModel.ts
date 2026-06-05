import fs from 'fs/promises';
import path from 'path';

export interface Clinica {
  idContrato: string;
  nome: string;
  cnpj: string;
  celular: string;
  email: string;
  ignorarEnvio: boolean;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/clinicas.json');

export async function readClinicas(): Promise<Clinica[]> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    const content = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeClinicas([]);
      return [];
    }
    console.error('Erro ao ler clínicas:', error);
    throw new Error('Falha ao obter lista de clínicas.');
  }
}

export async function writeClinicas(clinicas: Clinica[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(clinicas, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao escrever clínicas:', error);
    throw new Error('Falha ao salvar dados das clínicas.');
  }
}

export async function addClinica(clinica: Clinica): Promise<void> {
  const clinicas = await readClinicas();
  if (clinicas.some((c) => c.idContrato === clinica.idContrato)) {
    throw new Error(`Clínica com ID de contrato ${clinica.idContrato} já existe.`);
  }
  clinicas.push(clinica);
  await writeClinicas(clinicas);
}

export async function updateClinica(idContrato: string, data: Partial<Clinica>): Promise<Clinica> {
  const clinicas = await readClinicas();
  const index = clinicas.findIndex((c) => c.idContrato === idContrato);
  if (index === -1) {
    throw new Error(`Clínica com ID de contrato ${idContrato} não encontrada.`);
  }
  
  // Atualiza apenas os campos permitidos
  const updatedClinica = { ...clinicas[index], ...data };
  clinicas[index] = updatedClinica;
  await writeClinicas(clinicas);
  return updatedClinica;
}

export async function deleteClinica(idContrato: string): Promise<void> {
  const clinicas = await readClinicas();
  const filteredClinicas = clinicas.filter((c) => c.idContrato !== idContrato);
  if (clinicas.length === filteredClinicas.length) {
    throw new Error(`Clínica com ID de contrato ${idContrato} não encontrada.`);
  }
  await writeClinicas(filteredClinicas);
}
