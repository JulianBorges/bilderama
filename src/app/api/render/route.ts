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

    // Se for um erro de validação do Zod, retorna um erro 400 detalhado.
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Estrutura do PagePlan inválida.', details: error.errors }, { status: 400 });
    }

    // Para outros erros, retorna um erro 500 genérico.
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao renderizar a página.' },
      { status: 500 }
    );
  }
} 