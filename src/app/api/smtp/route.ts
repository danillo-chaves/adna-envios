export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as SmtpModel from '../../../models/smtpModel';
import * as EmailController from '../../../controllers/emailController';

export async function GET() {
  try {
    const smtpConfig = await SmtpModel.getSMTPConfig();
    // Envia a senha mascarada por segurança, mas retorna se houver alguma cadastrada
    const maskedPass = smtpConfig.pass ? '••••••••••••' : '';
    return NextResponse.json({
      user: smtpConfig.user,
      pass: maskedPass,
      host: smtpConfig.host || 'smtp.gmail.com',
      port: smtpConfig.port || 465,
      secure: smtpConfig.secure !== undefined ? smtpConfig.secure : true,
      hasPassword: !!smtpConfig.pass
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar configurações SMTP' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, pass, host, port, secure, testOnly } = body;

    const existingConfig = await SmtpModel.getSMTPConfig();
    
    // Se a senha for enviada mascarada ou vazia (e já temos senha), mantém a antiga
    let finalPass = pass;
    if ((pass === '••••••••••••' || pass === '************' || !pass) && existingConfig.pass) {
      finalPass = existingConfig.pass;
    }

    const targetConfig: SmtpModel.SMTPConfig = {
      user: user || '',
      pass: finalPass || '',
      host: host || 'smtp.gmail.com',
      port: Number(port) || 465,
      secure: secure !== undefined ? secure : true
    };

    if (testOnly) {
      await EmailController.testConnection(targetConfig);
      return NextResponse.json({ message: 'Conexão SMTP testada com sucesso!' });
    }

    await SmtpModel.saveSMTPConfig(targetConfig);
    return NextResponse.json({ message: 'Configurações SMTP salvas com sucesso!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro na operação SMTP' }, { status: 400 });
  }
}
