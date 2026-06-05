import nodemailer from 'nodemailer';
import * as SmtpModel from '../models/smtpModel';
import * as ClinicaModel from '../models/clinicaModel';

export interface EmailResult {
  idContrato: string;
  nomeClinica: string;
  email: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  arquivoEncontrado?: string;
}

export async function testConnection(config: SmtpModel.SMTPConfig): Promise<boolean> {
  if (!config.user || !config.pass) {
    throw new Error('E-mail do remetente e Senha de App são obrigatórios para testar a conexão.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host || 'smtp.gmail.com',
    port: config.port || 465,
    secure: config.secure !== undefined ? config.secure : true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    await transporter.verify();
    return true;
  } catch (error: any) {
    console.error('Erro ao verificar conexão SMTP:', error);
    throw new Error(error.message || 'Falha na autenticação SMTP. Verifique as credenciais.');
  }
}

function matchesClinica(filename: string, clinica: ClinicaModel.Clinica): boolean {
  const cleanFilename = filename.toLowerCase();
  const cleanCnpj = clinica.cnpj.replace(/\D/g, '');
  const cleanId = clinica.idContrato.toLowerCase().trim();

  // 1. Verifica correspondência pelo CNPJ limpo (ex: "12345678000199_nota.pdf")
  if (cleanCnpj && cleanFilename.includes(cleanCnpj)) {
    return true;
  }

  // 2. Verifica se o CNPJ com pontuação está no nome do arquivo
  // Formata CNPJ: XX.XXX.XXX/XXXX-XX
  const formattedCnpj = clinica.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").toLowerCase();
  if (formattedCnpj && cleanFilename.includes(formattedCnpj)) {
    return true;
  }

  // 3. Verifica correspondência pelo ID do contrato usando regex para evitar falsos positivos
  // (evita que o ID "2" combine com "20", "12" ou "202")
  if (cleanId) {
    const escapedId = cleanId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\D)${escapedId}(\\D|$)`, 'i');
    if (regex.test(cleanFilename)) {
      return true;
    }
  }

  return false;
}

export async function enviarEmailsEmMassa(
  subjectTemplate: string,
  bodyTemplate: string,
  attachments: Record<string, Array<{ name: string; base64: string }>>,
  contextType: 'nota' | 'boleto' | 'ambos'
): Promise<EmailResult[]> {
  // 1. Obter configurações SMTP
  const smtpConfig = await SmtpModel.getSMTPConfig();
  if (!smtpConfig.user || !smtpConfig.pass) {
    throw new Error('Configuração SMTP não encontrada ou incompleta. Vá para as configurações primeiro.');
  }

  // 2. Obter clínicas
  const clinicas = await ClinicaModel.readClinicas();
  if (clinicas.length === 0) {
    throw new Error('Nenhuma clínica cadastrada para envio.');
  }

  // 3. Criar transportador
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: smtpConfig.port || 465,
    secure: smtpConfig.secure !== undefined ? smtpConfig.secure : true,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const results: EmailResult[] = [];

  for (const clinica of clinicas) {
    const clinicaEmail = clinica.email || '';

    // Regra 1: Se ignorarEnvio for true
    if (clinica.ignorarEnvio) {
      results.push({
        idContrato: clinica.idContrato,
        nomeClinica: clinica.nome,
        email: clinicaEmail,
        status: 'skipped',
        reason: 'Marcação "ignorarEnvio" ativada (regra de exceção).',
      });
      continue;
    }

    // Regra 2: Encontrar arquivos correspondentes e validar quantidade/tipo
    const matchingFiles = attachments[clinica.idContrato];
    
    if (contextType === 'ambos') {
      if (!matchingFiles || matchingFiles.length < 2) {
        results.push({
          idContrato: clinica.idContrato,
          nomeClinica: clinica.nome,
          email: clinicaEmail,
          status: 'skipped',
          reason: 'Envio ignorado: "Ambos" selecionado, mas faltam anexos (necessário Nota Fiscal e Boleto).',
          arquivoEncontrado: matchingFiles ? matchingFiles.map(f => f.name).join(', ') : 'Nenhum',
        });
        continue;
      }
    } else {
      if (!matchingFiles || matchingFiles.length === 0) {
        results.push({
          idContrato: clinica.idContrato,
          nomeClinica: clinica.nome,
          email: clinicaEmail,
          status: 'skipped',
          reason: `Nenhum PDF associado a esta clínica para o envio de ${contextType === 'nota' ? 'Nota Fiscal' : 'Boleto'}.`,
        });
        continue;
      }
    }

    // Regra 3: Validar e-mail do destinatário
    if (!clinicaEmail || !clinicaEmail.includes('@')) {
      results.push({
        idContrato: clinica.idContrato,
        nomeClinica: clinica.nome,
        email: clinicaEmail,
        status: 'failed',
        reason: 'E-mail da clínica é inválido ou não cadastrado.',
        arquivoEncontrado: matchingFiles.map(f => f.name).join(', '),
      });
      continue;
    }

    try {
      // Substituição de variáveis dinâmicas no Assunto e Corpo
      let subject = subjectTemplate;
      let body = bodyTemplate;

      const replacements: Record<string, string> = {
        '{{nome_clinica}}': clinica.nome,
        '{{cnpj_clinica}}': clinica.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
        '{{id_contrato}}': clinica.idContrato,
        '{{celular_clinica}}': clinica.celular.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2 $3-$4"),
      };

      for (const [tag, value] of Object.entries(replacements)) {
        subject = subject.replaceAll(tag, value);
        body = body.replaceAll(tag, value);
      }

      // Envia o e-mail
      await transporter.sendMail({
        from: `"${smtpConfig.user.split('@')[0]}" <${smtpConfig.user}>`,
        to: clinicaEmail,
        subject: subject,
        text: body, // Formato texto simples conforme a spec
        attachments: matchingFiles.map(file => ({
          filename: file.name,
          content: Buffer.from(file.base64, 'base64'),
          contentType: 'application/pdf',
        })),
      });

      results.push({
        idContrato: clinica.idContrato,
        nomeClinica: clinica.nome,
        email: clinicaEmail,
        status: 'success',
        arquivoEncontrado: matchingFiles.map(f => f.name).join(', '),
      });
    } catch (error: any) {
      console.error(`Erro ao enviar e-mail para ${clinica.nome}:`, error);
      results.push({
        idContrato: clinica.idContrato,
        nomeClinica: clinica.nome,
        email: clinicaEmail,
        status: 'failed',
        reason: error.message || 'Erro de rede ou autenticação SMTP no envio.',
        arquivoEncontrado: matchingFiles.map(f => f.name).join(', '),
      });
    }
  }

  return results;
}
