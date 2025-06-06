import { OpenAIStream, StreamingTextResponse } from 'ai'
import { config } from '@/lib/config'
import { processUserInput } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userInput } = await req.json()

    if (!userInput) {
      return NextResponse.json({ error: 'userInput é obrigatório' }, { status: 400 });
    }

    const aiResponse = await processUserInput(userInput as string)

    return NextResponse.json(aiResponse)

  } catch (error: any) {
    console.error('[API CHAT ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao processar a solicitação' },
      { status: 500 }
    )
  }
} 