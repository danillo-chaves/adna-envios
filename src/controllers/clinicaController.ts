import * as ClinicaModel from '../models/clinicaModel';

export async function getClinicas() {
  return await ClinicaModel.readClinicas();
}

export async function createClinica(data: {
  idContrato: string;
  nome: string;
  cnpj: string;
  celular: string;
  email: string;
}) {
  const { idContrato, nome, cnpj, celular, email } = data;

  // Validações básicas de negócio
  if (!idContrato || !idContrato.trim()) {
    throw new Error('O ID do contrato é obrigatório.');
  }
  if (!nome || !nome.trim()) {
    throw new Error('O nome da clínica é obrigatório.');
  }
  if (!cnpj || !cnpj.trim()) {
    throw new Error('O CNPJ é obrigatório.');
  }
  if (!email || !email.trim() || !email.includes('@')) {
    throw new Error('Um e-mail válido é obrigatório.');
  }
  
  // Limpa caracteres especiais do CNPJ para validação
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) {
    throw new Error('O CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  const cleanCelular = celular.replace(/\D/g, '');
  if (cleanCelular.length < 10 || cleanCelular.length > 11) {
    throw new Error('O celular deve ter 10 ou 11 dígitos com o DDD.');
  }

  const novaClinica: ClinicaModel.Clinica = {
    idContrato: idContrato.trim(),
    nome: nome.trim(),
    cnpj: cleanCnpj,
    celular: cleanCelular,
    email: email.trim().toLowerCase(),
    ignorarEnvio: false, // Por padrão, não ignora
  };

  await ClinicaModel.addClinica(novaClinica);
  return novaClinica;
}

export async function updateClinica(idContrato: string, data: Partial<ClinicaModel.Clinica>) {
  if (data.cnpj !== undefined) {
    const cleanCnpj = data.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      throw new Error('O CNPJ deve conter exatamente 14 dígitos numéricos.');
    }
    data.cnpj = cleanCnpj;
  }

  if (data.celular !== undefined) {
    const cleanCelular = data.celular.replace(/\D/g, '');
    if (cleanCelular.length < 10 || cleanCelular.length > 11) {
      throw new Error('O celular deve ter 10 ou 11 dígitos.');
    }
    data.celular = cleanCelular;
  }

  if (data.email !== undefined) {
    if (!data.email || !data.email.trim() || !data.email.includes('@')) {
      throw new Error('Um e-mail válido é obrigatório.');
    }
    data.email = data.email.trim().toLowerCase();
  }

  return await ClinicaModel.updateClinica(idContrato, data);
}

export async function deleteClinica(idContrato: string) {
  if (!idContrato) {
    throw new Error('O ID do contrato é obrigatório para exclusão.');
  }
  await ClinicaModel.deleteClinica(idContrato);
}
