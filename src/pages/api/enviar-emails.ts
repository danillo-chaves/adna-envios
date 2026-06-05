import type { NextApiRequest, NextApiResponse } from 'next';
import * as EmailController from '../../../src/controllers/emailController';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { subjectTemplate, bodyTemplate, attachments, contextType } = req.body;

    if (!subjectTemplate || !subjectTemplate.trim()) {
      return res.status(400).json({ error: 'O assunto do e-mail é obrigatório.' });
    }
    if (!bodyTemplate || !bodyTemplate.trim()) {
      return res.status(400).json({ error: 'O corpo do e-mail é obrigatório.' });
    }
    if (!contextType || !['nota', 'boleto', 'ambos'].includes(contextType)) {
      return res.status(400).json({ error: 'O tipo de contexto é obrigatório e deve ser "nota", "boleto" ou "ambos".' });
    }
    if (!attachments || typeof attachments !== 'object') {
      return res.status(400).json({ error: 'Os anexos das clínicas não foram enviados ou estão inválidos.' });
    }

    const results = await EmailController.enviarEmailsEmMassa(
      subjectTemplate.trim(),
      bodyTemplate,
      attachments,
      contextType
    );

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error('Erro na rota de envio em massa:', error);
    return res.status(500).json({ error: error.message || 'Erro durante o disparo de e-mails' });
  }
}
