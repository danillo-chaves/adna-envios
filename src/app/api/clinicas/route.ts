export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as ClinicaController from '../../../controllers/clinicaController';

export async function GET() {
  try {
    const clinicas = await ClinicaController.getClinicas();
    return NextResponse.json(clinicas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao obter clínicas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novaClinica = await ClinicaController.createClinica(body);
    return NextResponse.json(novaClinica, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar clínica' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idContrato = searchParams.get('idContrato');
    if (!idContrato) {
      return NextResponse.json({ error: 'O ID do contrato é obrigatório.' }, { status: 400 });
    }
    const body = await request.json();
    const updated = await ClinicaController.updateClinica(idContrato, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar clínica' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idContrato = searchParams.get('idContrato');
    if (!idContrato) {
      return NextResponse.json({ error: 'O ID do contrato é obrigatório.' }, { status: 400 });
    }
    await ClinicaController.deleteClinica(idContrato);
    return NextResponse.json({ message: 'Clínica excluída com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir clínica' }, { status: 400 });
  }
}
