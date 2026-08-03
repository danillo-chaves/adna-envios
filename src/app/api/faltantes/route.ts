import { NextResponse } from 'next/server';
import { readFaltantes, addFaltante, addFaltantesEmLote, deleteFaltante, Faltante } from '@/models/faltantesModel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const faltantes = await readFaltantes();
    return NextResponse.json(faltantes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao obter faltantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      await addFaltantesEmLote(body);
      return NextResponse.json({ message: 'Faltantes adicionados em lote com sucesso' }, { status: 201 });
    } else {
      const id = await addFaltante(body as Omit<Faltante, 'id'>);
      return NextResponse.json({ message: 'Faltante adicionado com sucesso', id }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar faltante' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do faltante é obrigatório' }, { status: 400 });
    }
    
    await deleteFaltante(id);
    return NextResponse.json({ message: 'Faltante removido com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao deletar faltante' }, { status: 500 });
  }
}
