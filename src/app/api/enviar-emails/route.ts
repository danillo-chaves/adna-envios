import { NextResponse } from 'next/server';
import * as EmailController from '../../../controllers/emailController';

export async function POST(req: Request) {
  try {
    const { subjectTemplate, bodyTemplate, attachments, contextType } = await req.json();

    if (!subjectTemplate || !subjectTemplate.trim()) {
      return NextResponse.json({ error: 'O assunto do e-mail é obrigatório.' }, { status: 400 });
    }
    if (!bodyTemplate || !bodyTemplate.trim()) {
      return NextResponse.json({ error: 'O corpo do e-mail é obrigatório.' }, { status: 400 });
    }
    if (!contextType || !['nota', 'boleto', 'ambos'].includes(contextType)) {
      return NextResponse.json({ error: 'O tipo de contexto é obrigatório e deve ser "nota", "boleto" ou "ambos".' }, { status: 400 });
    }
    if (!attachments || typeof attachments !== 'object') {
      return NextResponse.json({ error: 'Os anexos das clínicas não foram enviados ou estão inválidos.' }, { status: 400 });
    }

    const results = await EmailController.enviarEmailsEmMassa(
      subjectTemplate.trim(),
      bodyTemplate,
      attachments,
      contextType
    );

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: any) {
    console.error('Erro na rota de envio em massa:', error);
    return NextResponse.json({ error: error.message || 'Erro durante o disparo de e-mails' }, { status: 500 });
  }
}
