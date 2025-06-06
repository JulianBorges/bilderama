import { NextResponse } from 'next/server';
import { generateCode, processUserInput } from '@/lib/ai';
import { pagePlanSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validar o corpo da requisição com Zod
    const pagePlan = pagePlanSchema.parse(body);

    // 2. Chamar apenas a função generateCode com o plano validado
    const files = await generateCode(JSON.stringify(pagePlan));

    // 3. Retornar os arquivos gerados
    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('[API BUILD ERROR]', error);

    // Se for um erro de validação do Zod, ele será detalhado
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid page plan structure.', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao construir a página.' },
      { status: 500 }
    );
  }
} 