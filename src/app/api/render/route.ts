import { NextRequest, NextResponse } from 'next/server';
import { pagePlanSchema } from '@/lib/schemas';
import { renderPage } from '@/lib/renderer';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // 1. Obter o corpo da requisição
    const body = await req.json();

    // 2. Validar o corpo com o nosso esquema Zod
    const pagePlan = pagePlanSchema.parse(body);

    // 3. Renderizar a página usando o novo serviço de renderização
    const files = await renderPage(pagePlan);

    // 4. Retornar os arquivos gerados
    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('[API RENDER ERROR]', error);

    // Se for um erro de validação do Zod, retorna uma resposta mais específica
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Corpo da requisição inválido.', details: error }, { status: 400 });
    }

    // Para outros erros, retorna um erro 500 genérico.
    return NextResponse.json(
      { error: 'Erro interno do servidor ao renderizar a página.' },
      { status: 500 }
    );
  }
} 